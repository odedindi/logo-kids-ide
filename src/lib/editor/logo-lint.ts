import { linter, Diagnostic as CMDiagnostic } from '@codemirror/lint';
import { tokenize } from '../logo-core/tokenizer';
import { parse } from '../logo-core/parser';
import { analyzeProgram } from '../logo-core/analyzer';
import { computeQuickFixes, applyQuickFix, lowercaseKeywordDiagnostics } from './quick-fix';
import type { Diagnostic } from '../logo-core/types';

function diagnosticToCM(diag: Diagnostic | { message: string; range: any }): CMDiagnostic {
  return {
    from: diag.range.start.offset,
    to: Math.max(diag.range.start.offset + 1, diag.range.end.offset),
    severity: 'severity' in diag && diag.severity === 'warning' ? 'warning' : 'error',
    message: 'kidMessage' in diag ? diag.kidMessage : diag.message,
  };
}

export const logoLinter = linter(
  (view) => {
    const code = view.state.doc.toString();
    if (!code.trim()) return [];

    try {
      const tokens = tokenize(code);
      const ast = parse(tokens);

      const procedures = new Map();
      ast.body.forEach((node) => {
        if (node.type === 'ProcedureDefinition') {
          procedures.set(node.name, node);
        }
      });

      const diagnostics = [...analyzeProgram(ast, procedures), ...lowercaseKeywordDiagnostics(code)];
      const fixes = computeQuickFixes(code);

      return diagnostics.map((diag) => {
        const cm = diagnosticToCM(diag);
        const fix = fixes.find(
          (f) => f.from >= diag.range.start.offset && f.from <= diag.range.end.offset,
        );
        if (fix) {
          cm.actions = [
            {
              name: 'Fix it',
              apply: (view) => {
                const doc = view.state.doc.toString();
                const current = computeQuickFixes(doc).find(
                  (f) => f.kind === fix.kind && Math.abs(f.from - fix.from) <= 3,
                );
                if (current) {
                  const fixed = applyQuickFix(doc, current);
                  view.dispatch({ changes: { from: 0, to: doc.length, insert: fixed } });
                }
              },
            },
          ];
        }
        return cm;
      });
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'range' in e) {
        return [diagnosticToCM(e as { message: string; range: any })];
      }
      return [];
    }
  },
  { delay: 300 }
);