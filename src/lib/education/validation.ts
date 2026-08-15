import { tokenize } from '../logo-core/tokenizer';
import { parse } from '../logo-core/parser';
import { executeStep } from '../logo-core/executor';
import type {
  ASTNode, ExecutionContext, ExecutionStatus, Program, ProcedureDefinition,
  Token, TraceOp, TurtleState,
} from '../logo-core/types';
import type { Challenge } from './content';

/**
 * Challenge validation.
 *
 * `Challenge.validationCode` is interpreted in one of three ways, whichever
 * most naturally fits each challenge's data:
 *
 * 1. drawing   – validationCode is a complete, terminating program (e.g.
 *                `REPEAT 4 [ FD 100 RT 90 ]`). The kid's program is executed
 *                and its drawn shape is compared to the expected one.
 * 2. presence  – validationCode is a partial spec that does not parse as a
 *                program (e.g. `SETPC`, or `TO BRANCH`). The kid's code must
 *                use the required commands and/or define the procedures.
 * 3. recursive-procedure – validationCode parses but never terminates (e.g.
 *                the infinite SPIRAL). The kid's code must define the named
 *                procedure, make it recursive, and actually draw.
 *
 * All executions are bounded so a runaway program can never hang the app.
 */

const STEP_LIMIT = 20_000;
const DIST_TOL = 1.0;
const ANGLE_TOL = 1.0;

const INITIAL_TURTLE: TurtleState = { x: 0, y: 0, heading: 0, penDown: true, penColor: 'black', visible: true };

export type ChallengeValidationKind =
  | 'success'
  | 'code-error'
  | 'runtime-error'
  | 'too-many-steps'
  | 'no-drawing'
  | 'wrong-drawing'
  | 'missing-command'
  | 'missing-procedure'
  | 'procedure-not-invoked'
  | 'missing-recursion';

export interface ChallengeValidation {
  success: boolean;
  kind: ChallengeValidationKind;
  steps: number;
  traceLength: number;
}

export interface ProgramRun {
  ok: boolean;
  ast: Program | null;
  procedures: Map<string, ProcedureDefinition>;
  trace: TraceOp[];
  turtle: TurtleState | null;
  status: ExecutionStatus;
  steps: number;
  error?: unknown;
}

interface Segment {
  dist: number;
  delta: number;
}

interface DrawingSpec {
  kind: 'drawing';
  signature: Segment[];
}

interface PresenceSpec {
  kind: 'presence';
  requiredCommands: string[];
  requiredProcedures: string[];
}

interface RecursiveProcedureSpec {
  kind: 'recursive-procedure';
  procedureName: string;
}

type ChallengeSpec = DrawingSpec | PresenceSpec | RecursiveProcedureSpec;

const COMMAND_ALIASES: Record<string, string> = {
  FD: 'FD', FORWARD: 'FD',
  BK: 'BK', BACK: 'BK',
  LT: 'LT', LEFT: 'LT',
  RT: 'RT', RIGHT: 'RT',
  PU: 'PU', PENUP: 'PU',
  PD: 'PD', PENDOWN: 'PD',
  SETPC: 'SETPC', SETPENCOLOR: 'SETPC',
  SETXY: 'SETXY',
  SETHEADING: 'SETH', SETH: 'SETH',
  HOME: 'HOME',
  CS: 'CS', CLEARSCREEN: 'CS',
  PRINT: 'PRINT', PR: 'PRINT',
  REPEAT: 'REPEAT',
  TO: 'TO', END: 'END',
  IF: 'IF', IFELSE: 'IFELSE', STOP: 'STOP',
};

function canonicalCommand(name: string): string | undefined {
  return COMMAND_ALIASES[name.toUpperCase()];
}

function normalizeAngle(deg: number): number {
  let a = deg % 360;
  if (a > 180) a -= 360;
  if (a <= -180) a += 360;
  return a;
}

function collectProcedures(ast: Program | null): Map<string, ProcedureDefinition> {
  const map = new Map<string, ProcedureDefinition>();
  if (!ast) return map;

  const visit = (node: ASTNode | undefined) => {
    if (!node) return;
    const n = node as { body?: ASTNode[]; thenBody?: ASTNode[]; elseBody?: ASTNode[] };
    if (node.type === 'ProcedureDefinition') {
      map.set(node.name.toUpperCase(), node);
    }
    if (n.body) n.body.forEach(visit);
    if (n.thenBody) n.thenBody.forEach(visit);
    if (n.elseBody) n.elseBody.forEach(visit);
  };

  ast.body.forEach(visit);
  return map;
}

function runProgram(code: string, stepLimit = STEP_LIMIT): ProgramRun {
  try {
    const tokens = tokenize(code);
    const ast = parse(tokens);
    const procedures = collectProcedures(ast);

    let ctx: ExecutionContext = {
      procedures,
      callStack: [{ name: 'main', lineIndex: 0, body: ast.body }],
      loopStack: [],
      turtle: { ...INITIAL_TURTLE },
      trace: [],
      speed: 1,
      status: 'running',
    };

    let steps = 0;
    while (ctx.status === 'running' && steps < stepLimit) {
      ctx = executeStep(ctx);
      steps++;
      if (ctx.callStack.length === 0) ctx.status = 'completed';
    }

    return {
      ok: true,
      ast,
      procedures,
      trace: ctx.trace,
      turtle: ctx.turtle,
      status: ctx.status,
      steps,
    };
  } catch (e: unknown) {
    return {
      ok: false,
      ast: null,
      procedures: new Map(),
      trace: [],
      turtle: null,
      status: 'error',
      steps: 0,
      error: e,
    };
  }
}

function drawingSignature(trace: TraceOp[]): Segment[] {
  const drawn: { heading: number; dist: number }[] = [];
  for (const op of trace) {
    if (op.type !== 'MOVE') continue;
    const dist = Math.hypot(op.to.x - op.from.x, op.to.y - op.from.y);
    if (dist < 0.5) continue;
    drawn.push({ heading: op.to.heading, dist });
  }

  const sig: Segment[] = drawn.map((d, i) => {
    const next = drawn[i + 1];
    const delta = next ? normalizeAngle(next.heading - d.heading) : 0;
    return { dist: d.dist, delta };
  });

  const first = sig.find((s) => Math.abs(s.delta) > ANGLE_TOL);
  if (first && first.delta < 0) {
    for (const s of sig) s.delta = -s.delta;
  }
  return sig;
}

function signatureMatches(kidTrace: TraceOp[], reference: Segment[]): boolean {
  const kidSig = drawingSignature(kidTrace);
  if (kidSig.length !== reference.length) return false;
  for (let i = 0; i < reference.length; i++) {
    if (Math.abs(kidSig[i].dist - reference[i].dist) > DIST_TOL) return false;
    if (Math.abs(normalizeAngle(kidSig[i].delta - reference[i].delta)) > ANGLE_TOL) return false;
  }
  return true;
}

function extractRequiredCommands(tokens: Token[]): string[] {
  const found = new Set<string>();
  for (const tok of tokens) {
    if (tok.type === 'COMMAND' || tok.type === 'ENV_COMMAND') {
      const canonical = canonicalCommand(tok.value);
      if (canonical) found.add(canonical);
    }
  }
  return [...found];
}

function extractRequiredProcedures(tokens: Token[]): string[] {
  const names: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.type === 'STRUCT_COMMAND' && tok.value.toUpperCase() === 'TO') {
      let j = i + 1;
      while (j < tokens.length && (tokens[j].type === 'WHITESPACE' || tokens[j].type === 'NEWLINE' || tokens[j].type === 'COMMENT')) {
        j++;
      }
      if (j < tokens.length && tokens[j].type === 'PROCEDURE_NAME') {
        names.push(tokens[j].value.toUpperCase());
      }
    }
  }
  return names;
}

function computeSpec(validationCode: string): ChallengeSpec {
  const tokens = tokenize(validationCode);
  const reference = runProgram(validationCode);

  if (reference.ok && reference.status === 'completed') {
    return {
      kind: 'drawing',
      signature: drawingSignature(reference.trace),
    };
  }

  if (reference.ok) {
    const recursiveProcs = [...reference.procedures.values()].filter((p) => isRecursiveProcedure(p));
    const name = recursiveProcs[0]?.name.toUpperCase() ?? '';
    if (name) {
      return { kind: 'recursive-procedure', procedureName: name };
    }
  }

  return {
    kind: 'presence',
    requiredCommands: extractRequiredCommands(tokens),
    requiredProcedures: extractRequiredProcedures(tokens),
  };
}

const specCache = new Map<string, ChallengeSpec>();

function deriveSpec(validationCode: string): ChallengeSpec {
  const cached = specCache.get(validationCode);
  if (cached) return cached;
  const spec = computeSpec(validationCode);
  specCache.set(validationCode, spec);
  return spec;
}

function nodeContainsCall(node: ASTNode | undefined, name: string): boolean {
  if (!node) return false;
  if (node.type === 'ProcedureCall') {
    if (node.name.toUpperCase() === name) return true;
  }
  const n = node as { body?: ASTNode[]; thenBody?: ASTNode[]; elseBody?: ASTNode[] };
  if (n.body && n.body.some((child) => nodeContainsCall(child, name))) return true;
  if (n.thenBody && n.thenBody.some((child) => nodeContainsCall(child, name))) return true;
  if (n.elseBody && n.elseBody.some((child) => nodeContainsCall(child, name))) return true;
  return false;
}

function isRecursiveProcedure(proc: ProcedureDefinition): boolean {
  return proc.body.some((node) => nodeContainsCall(node, proc.name.toUpperCase()));
}

function isInvokedAtTopLevel(ast: Program | null, name: string): boolean {
  if (!ast) return false;
  return ast.body.some((node) => node.type === 'ProcedureCall' && node.name.toUpperCase() === name);
}

function collectUsedCommands(ast: Program | null): Set<string> {
  const used = new Set<string>();
  if (!ast) return used;

  const visit = (node: ASTNode | undefined) => {
    if (!node) return;
    if ('command' in node && typeof node.command === 'string') {
      const canonical = canonicalCommand(node.command);
      if (canonical) used.add(canonical);
    }
    const n = node as { body?: ASTNode[]; thenBody?: ASTNode[]; elseBody?: ASTNode[] };
    if (n.body) n.body.forEach(visit);
    if (n.thenBody) n.thenBody.forEach(visit);
    if (n.elseBody) n.elseBody.forEach(visit);
  };

  ast.body.forEach(visit);
  return used;
}

export function validateChallenge(code: string, challenge: Challenge): ChallengeValidation {
  const spec = deriveSpec(challenge.validationCode);
  const kid = runProgram(code);

  const fail = (kind: ChallengeValidationKind): ChallengeValidation => ({
    success: false,
    kind,
    steps: kid.steps,
    traceLength: kid.trace.length,
  });

  if (!kid.ok) return fail('code-error');
  if (kid.status === 'error') return fail('runtime-error');

  switch (spec.kind) {
    case 'drawing': {
      if (kid.status !== 'completed') return fail('too-many-steps');
      if (signatureMatches(kid.trace, spec.signature)) {
        return { success: true, kind: 'success', steps: kid.steps, traceLength: kid.trace.length };
      }
      return fail(kid.trace.length === 0 ? 'no-drawing' : 'wrong-drawing');
    }

    case 'presence': {
      const used = collectUsedCommands(kid.ast);
      for (const cmd of spec.requiredCommands) {
        if (!used.has(cmd)) return fail('missing-command');
      }
      for (const name of spec.requiredProcedures) {
        const proc = kid.procedures.get(name.toUpperCase());
        if (!proc) return fail('missing-procedure');
        if (!isRecursiveProcedure(proc)) return fail('missing-recursion');
        if (!isInvokedAtTopLevel(kid.ast, name)) return fail('procedure-not-invoked');
      }
      if (kid.trace.filter((op) => op.type === 'MOVE').length === 0) return fail('no-drawing');
      // With the current engine, STOP inside IF only pops the IF frame, so a
      // recursive procedure guarded by IF ... [ STOP ] never terminates.
      // Procedure-based checks therefore grade on the recursion itself, not
      // on completion. Command-only checks (e.g. colorful-shape) can and do
      // require completion.
      if (spec.requiredProcedures.length === 0 && kid.status !== 'completed') return fail('too-many-steps');
      return { success: true, kind: 'success', steps: kid.steps, traceLength: kid.trace.length };
    }

    case 'recursive-procedure': {
      const name = spec.procedureName.toUpperCase();
      const proc = kid.procedures.get(name);
      if (!proc) return fail('missing-procedure');
      if (!isRecursiveProcedure(proc)) return fail('missing-recursion');
      if (!isInvokedAtTopLevel(kid.ast, name)) return fail('procedure-not-invoked');
      if (kid.trace.filter((op) => op.type === 'MOVE').length === 0) return fail('no-drawing');
      return { success: true, kind: 'success', steps: kid.steps, traceLength: kid.trace.length };
    }
  }
}

export { runProgram, drawingSignature };
