import { describe, it, expect } from 'vitest';
import { analyzeProgram } from '../../lib/logo-core/analyzer';
import { Program, Diagnostic, ProcedureDefinition } from '../../lib/logo-core/types';

const dummyRange = { start: { line: 1, col: 1, offset: 0 }, end: { line: 1, col: 5, offset: 4 } };

describe('Logo Analyzer', () => {
  it('detects undefined procedure calls', () => {
    const program: Program = {
      type: 'Program',
      range: dummyRange,
      body: [
        {
          type: 'ProcedureCall',
          name: 'UNKNOWN',
          args: [],
          range: dummyRange,
          nameRange: dummyRange
        }
      ]
    };
    const diagnostics = analyzeProgram(program, new Map());
    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].kidMessage).toContain("I don't know how to UNKNOWN");
  });

  it('detects wrong number of arguments', () => {
    const program: Program = {
      type: 'Program',
      range: dummyRange,
      body: [
        {
          type: 'ProcedureCall',
          name: 'SQUARE',
          args: [],
          range: dummyRange,
          nameRange: dummyRange
        }
      ]
    };
    const procs = new Map<string, ProcedureDefinition>();
    procs.set('SQUARE', {
      type: 'ProcedureDefinition',
      name: 'SQUARE',
      params: ['SIZE'],
      body: [],
      range: dummyRange,
      nameRange: dummyRange
    });
    
    const diagnostics = analyzeProgram(program, procs);
    expect(diagnostics.length).toBe(1);
    expect(diagnostics[0].kidMessage).toContain("SQUARE needs 1 number, but you gave 0");
  });

  it('allows valid programs', () => {
    const program: Program = {
      type: 'Program',
      range: dummyRange,
      body: [
        {
          type: 'MoveCommand',
          command: 'FD',
          distance: { type: 'NumberLiteral', value: 100, range: dummyRange },
          range: dummyRange
        }
      ]
    };
    const diagnostics = analyzeProgram(program, new Map());
    expect(diagnostics.length).toBe(0);
  });
});
