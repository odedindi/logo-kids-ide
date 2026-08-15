import { linter, Diagnostic as CMDiagnostic } from '@codemirror/lint';
import { tokenize } from '../logo-core/tokenizer';
import { parse } from '../logo-core/parser';
import { analyzeProgram } from '../logo-core/analyzer';
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

      const diagnostics = analyzeProgram(ast, procedures);
      return diagnostics.map(diagnosticToCM);
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'range' in e) {
        return [diagnosticToCM(e as { message: string; range: any })];
      }
      return [];
    }
  },
  { delay: 300 }
);
