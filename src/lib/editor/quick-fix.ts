import { tokenize } from '../logo-core/tokenizer';
import { parse } from '../logo-core/parser';
import type {
  ASTNode, Diagnostic, Expression, ProcedureCall, ProcedureDefinition,
  Program, SourceRange, Token,
} from '../logo-core/types';

/**
 * Quick-fix layer for common Logo mistakes.
 *
 * Pure and UI-agnostic: `computeQuickFixes(code)` returns an ordered list of
 * `QuickFix` objects. Each fix knows exactly which characters it touches
 * (`from`/`to`) and how to apply itself, so it can be applied and undone
 * (the editor's CodeMirror `history` extension records the resulting
 * transaction, so Ctrl/Cmd+Z reverts a fix).
 *
 * Fixes come from two sources:
 *
 * 1. Parse errors - e.g. `FD` with no number, `REPEAT 4 FD 100` without
 *    brackets, `TO SQUARE` without `END`. The parser throws a `ParseError`
 *    before analysis can run, so we repair the source text directly.
 * 2. Analyzer diagnostics - e.g. an undefined procedure that is a close
 *    misspelling of a known command (`FWD` -> `FD`), or a procedure called
 *    with too few/too many arguments.
 *
 * We also detect lowercase keywords ourselves (the analyzer only sees the
 * uppercased AST) and offer an uppercase fix for them, mirroring the
 * existing "Format code" behaviour as a one-click, per-problem fix.
 */

export type QuickFixKind =
  | 'uppercase-keyword'
  | 'missing-argument'
  | 'bad-argument-word'
  | 'missing-brackets'
  | 'unclosed-brackets'
  | 'missing-paren'
  | 'missing-end'
  | 'undefined-procedure'
  | 'arg-count-too-few'
  | 'arg-count-too-many';

export interface QuickFix {
  id: string;
  kind: QuickFixKind;
  label: string;
  /** Document offset where the fix anchors (== `to` for pure insertions). */
  from: number;
  /** End of the region the fix replaces (`from` for pure insertions). */
  to: number;
  apply: (code: string) => string;
}

const DEFAULT_ARGS: Record<string, string> = {
  FD: '50', FORWARD: '50', BK: '50', BACK: '50',
  LT: '90', LEFT: '90', RT: '90', RIGHT: '90',
  SETPC: '1', SETPENCOLOR: '1',
  SETXY: '0 0',
  SETHEADING: '90', SETH: '90',
  REPEAT: '4',
};

const DEFAULT_PROCEDURE_ARG = '50';

function significantTokens(tokens: Token[]): Token[] {
  return tokens.filter(
    (t) => t.type !== 'WHITESPACE' && t.type !== 'NEWLINE' && t.type !== 'COMMENT' && t.type !== 'EOF',
  );
}

// Skips trailing whitespace so the insertion lands right after the last token
// (e.g. `REPEAT 4 [ FD 100 RT 90\n` -> `... RT 90 ]\n`).
function makeInsertFix(
  code: string,
  pos: number,
  insert: string,
  kind: QuickFixKind,
  label: string,
): QuickFix {
  let p = pos;
  while (p > 0 && /\s/.test(code[p - 1])) p--;
  return {
    id: `${kind}:${p}`,
    kind,
    label,
    from: p,
    to: p,
    apply: (c) => c.slice(0, p) + insert + c.slice(p),
  };
}

function makeReplaceFix(
  from: number,
  to: number,
  replacement: string,
  kind: QuickFixKind,
  label: string,
): QuickFix {
  return {
    id: `${kind}:${from}`,
    kind,
    label,
    from,
    to,
    apply: (c) => c.slice(0, from) + replacement + c.slice(to),
  };
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

const KNOWN_COMMANDS = Object.keys(DEFAULT_ARGS);

// Only offer a "did you mean" suggestion when the misspelling is close
// enough to be confident (edit distance <= 2).
function closestCommand(name: string): string | undefined {
  const upper = name.toUpperCase();
  let best: string | undefined;
  let bestDist = Infinity;
  for (const cmd of KNOWN_COMMANDS) {
    const d = levenshtein(upper, cmd);
    if (d < bestDist) {
      bestDist = d;
      best = cmd;
    }
  }
  return best && bestDist <= 2 ? best : undefined;
}

function makeUppercaseFix(tok: Token): QuickFix {
  const upper = tok.value.toUpperCase();
  return makeReplaceFix(
    tok.range.start.offset,
    tok.range.end.offset,
    upper,
    'uppercase-keyword',
    `Make it ${upper}`,
  );
}

function makeUndefinedProcedureFix(node: ProcedureCall, cmd: string): QuickFix {
  return makeReplaceFix(
    node.nameRange.start.offset,
    node.nameRange.end.offset,
    cmd,
    'undefined-procedure',
    `Did you mean ${cmd}?`,
  );
}

function makeArgCountTooFewFix(code: string, node: ProcedureCall, proc: ProcedureDefinition): QuickFix {
  const missing = proc.params.length - node.args.length;
  const insert = ` ${DEFAULT_PROCEDURE_ARG}`.repeat(missing);
  return makeInsertFix(
    code,
    node.range.end.offset,
    insert,
    'arg-count-too-few',
    `Add ${missing} number${missing === 1 ? '' : 's'}`,
  );
}

function makeArgCountTooManyFix(node: ProcedureCall, proc: ProcedureDefinition): QuickFix {
  const keep = proc.params.length;
  const extraStart = node.args[keep]?.range.start.offset ?? node.range.end.offset;
  return makeReplaceFix(
    extraStart,
    node.range.end.offset,
    '',
    'arg-count-too-many',
    'Remove the extra numbers',
  );
}

function makeWrapInBracketsFix(code: string, pos: number): QuickFix {
  let lineEnd = code.indexOf('\n', pos);
  if (lineEnd === -1) lineEnd = code.length;
  let end = lineEnd;
  while (end > pos && /\s/.test(code[end - 1])) end--;
  return {
    id: `missing-brackets:${pos}`,
    kind: 'missing-brackets',
    label: 'Add [ and ]',
    from: pos,
    to: end,
    apply: (c) => c.slice(0, pos) + '[ ' + c.slice(pos, end) + ' ]' + c.slice(end),
  };
}

// Repairs an expression that failed to parse because a command is missing its
// argument (e.g. `FD`, `FD\nRT 90`, `SETXY 100`, `FD 5 +`, `REPEAT [ ... ]`)
// or because a word was used where a number belongs (e.g. `FD abc`).
function makeMissingArgumentFix(code: string, tokens: Token[], pos: number): QuickFix | null {
  const sig = significantTokens(tokens);

  // Walk back over expression continuations to find the command/operator that
  // was in the middle of parsing its argument.
  let cmdToken: Token | undefined;
  for (let i = sig.length - 1; i >= 0; i--) {
    const t = sig[i];
    if (t.range.end.offset > pos) continue;
    if (
      t.type === 'NUMBER' || t.type === 'WORD' || t.type === 'PARAMETER' ||
      t.type === 'RBRACKET' || t.type === 'RPAREN'
    ) {
      continue;
    }
    cmdToken = t;
    break;
  }
  if (!cmdToken) return null;
  const cmd = cmdToken.value.toUpperCase();

  // SETXY takes two numbers; count what is already there so we add exactly
  // what is missing (`SETXY` -> `0 0`, `SETXY 100` -> `100 0`).
  let argCount = 0;
  for (let i = sig.length - 1; i >= 0; i--) {
    const t = sig[i];
    if (t.range.end.offset <= cmdToken.range.start.offset) break;
    if (t.range.end.offset > pos) continue;
    if (t.type === 'NUMBER' || t.type === 'WORD' || t.type === 'PARAMETER') argCount++;
  }

  let insert: string | undefined;
  if (cmd === 'SETXY') {
    insert = argCount === 0 ? '0 0' : argCount === 1 ? '0' : undefined;
  } else if (cmd === '+' || cmd === '-' || cmd === '*' || cmd === '/') {
    insert = '0';
  } else {
    insert = DEFAULT_ARGS[cmd];
  }
  if (!insert) return null;

  const offending = tokens.find(
    (t) => t.range.start.offset === pos && t.type !== 'WHITESPACE' && t.type !== 'NEWLINE' && t.type !== 'COMMENT',
  );

  if (offending && (offending.type === 'PROCEDURE_NAME' || offending.type === 'WORD')) {
    return makeReplaceFix(
      offending.range.start.offset,
      offending.range.end.offset,
      insert,
      'bad-argument-word',
      `Use ${insert} instead`,
    );
  }

  return makeInsertFix(code, pos, ` ${insert}`, 'missing-argument', `Add ${insert}`);
}

// Most missing-argument / bracket errors never reach this point (the parser
// throws first); undefined-procedure and argument-count errors do.
function fixesFromAst(code: string, ast: Program, procedures: Map<string, ProcedureDefinition>): QuickFix[] {
  const fixes: QuickFix[] = [];

  const visit = (node: ASTNode | Expression) => {
    if (!node) return;

    if (node.type === 'ProcedureCall') {
      const call = node as ProcedureCall;
      const proc = procedures.get(call.name);
      if (!proc) {
        const cmd = closestCommand(call.name);
        if (cmd) fixes.push(makeUndefinedProcedureFix(call, cmd));
      } else if (call.args.length !== proc.params.length) {
        if (call.args.length < proc.params.length) {
          fixes.push(makeArgCountTooFewFix(code, call, proc));
        } else {
          fixes.push(makeArgCountTooManyFix(call, proc));
        }
      }
      call.args.forEach(visit);
    } else if (node.type === 'RepeatStatement') {
      if (node.count) visit(node.count);
      if (node.body) node.body.forEach(visit);
    } else if (node.type === 'ProcedureDefinition') {
      if (node.body === undefined || node.body === null) {
        fixes.push(makeInsertFix(code, code.length, '\nEND', 'missing-end', 'Add END'));
      } else {
        node.body.forEach(visit);
      }
    } else if (node.type === 'MoveCommand' || node.type === 'TurnCommand') {
      const m = node as { distance?: Expression; angle?: Expression };
      const arg = m.distance ?? m.angle;
      if (arg) visit(arg);
    } else if (node.type === 'ColorCommand') {
      if (node.color) visit(node.color);
    } else if (node.type === 'SetXYCommand') {
      if (node.x) visit(node.x);
      if (node.y) visit(node.y);
    } else if (node.type === 'BinaryExpression') {
      if (node.left) visit(node.left);
      if (node.right) visit(node.right);
    } else if (node.type === 'PrintCommand') {
      if (node.value) visit(node.value);
    } else if (node.type === 'SetHeadingCommand') {
      if (node.angle) visit(node.angle);
    }
  };

  ast.body.forEach(visit);
  return fixes;
}

/**
 * Lowercase-keyword warning diagnostics, e.g. `fd 100` -> warning on `fd`.
 * The analyzer only sees the uppercased AST, so this works directly on tokens.
 */
export function lowercaseKeywordDiagnostics(code: string): Diagnostic[] {
  const tokens = tokenize(code);
  const diags: Diagnostic[] = [];
  for (const tok of tokens) {
    if (
      (tok.type === 'COMMAND' || tok.type === 'STRUCT_COMMAND' || tok.type === 'ENV_COMMAND')
      && tok.value !== tok.value.toUpperCase()
    ) {
      diags.push({
        severity: 'warning',
        message: `Lowercase keyword: ${tok.value} (use ${tok.value.toUpperCase()})`,
        kidMessage: `I can read ${tok.value}, but Logo likes it as ${tok.value.toUpperCase()}!`,
        range: tok.range,
        source: 'quick-fix',
      });
    }
  }
  return diags;
}

export function computeQuickFixes(code: string): QuickFix[] {
  const fixes: QuickFix[] = [];
  const tokens = tokenize(code);

  for (const tok of tokens) {
    if (
      (tok.type === 'COMMAND' || tok.type === 'STRUCT_COMMAND' || tok.type === 'ENV_COMMAND')
      && tok.value !== tok.value.toUpperCase()
    ) {
      fixes.push(makeUppercaseFix(tok));
    }
  }

  try {
    const ast = parse(tokens);
    const procedures = new Map<string, ProcedureDefinition>();
    ast.body.forEach((node) => {
      if (node.type === 'ProcedureDefinition') procedures.set(node.name, node);
    });
    fixes.push(...fixesFromAst(code, ast, procedures));
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'range' in e) {
      const err = e as { message: string; range: SourceRange };
      const pos = err.range.start.offset;
      const msg = err.message;

      if (msg.startsWith("Expected '[' after") || msg.startsWith("Expected '[' for IFELSE")) {
        fixes.push(makeWrapInBracketsFix(code, pos));
      } else if (msg.startsWith("Expected ']' to close")) {
        fixes.push(makeInsertFix(code, pos, ' ]', 'unclosed-brackets', 'Close the brackets'));
      } else if (msg.startsWith("Expected ')'")) {
        fixes.push(makeInsertFix(code, pos, ')', 'missing-paren', 'Close the parentheses'));
      } else if (msg.startsWith('Expected END to close procedure definition')) {
        fixes.push(makeInsertFix(code, pos, '\nEND', 'missing-end', 'Add END'));
      } else if (msg.startsWith('Unexpected token in expression') || msg.startsWith('Unexpected procedure call in expression')) {
        const fix = makeMissingArgumentFix(code, tokens, pos);
        if (fix) fixes.push(fix);
      }
    }
  }

  return fixes;
}

export function applyQuickFix(code: string, fix: QuickFix): string {
  return fix.apply(code);
}

// Applies every available fix, re-deriving the remaining fixes after each
// application so interacting fixes stay correct. Used by the "Fix it for me"
// button; the final edit is one undo step for the kid.
export function applyAllQuickFixes(code: string, maxIterations = 20): string {
  let current = code;
  for (let i = 0; i < maxIterations; i++) {
    const fixes = computeQuickFixes(current);
    if (fixes.length === 0) return current;
    // Highest offset first so earlier offsets stay valid.
    const fix = fixes.reduce((a, b) => (b.from >= a.from ? b : a));
    const next = fix.apply(current);
    if (next === current) return current;
    current = next;
  }
  return current;
}
