import { describe, it, expect } from 'vitest';
import { executeProgram } from '../../lib/logo-core/executor';
import { Program, ExecutionContext, TraceOp, TurtleState, ProcedureDefinition } from '../../lib/logo-core/types';

const dummyRange = { start: { line: 1, col: 1, offset: 0 }, end: { line: 1, col: 5, offset: 4 } };

describe('Logo Executor', () => {
  it('executes FD command', () => {
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
    
    const context: ExecutionContext = {
      procedures: new Map(),
      callStack: [{ name: 'main', lineIndex: 0, body: program.body }],
      loopStack: [],
      turtle: { x: 0, y: 0, heading: 0, penDown: true, penColor: 'black', visible: true },
      trace: [],
      speed: 1,
      status: 'idle'
    };

    const newContext = executeProgram(program, context);
    expect(newContext.turtle.y).toBeCloseTo(-100);
    expect(newContext.trace.length).toBe(1);
    expect(newContext.trace[0].type).toBe('MOVE');
  });

  it('executes REPEAT statement', () => {
    const program: Program = {
      type: 'Program',
      range: dummyRange,
      body: [
        {
          type: 'RepeatStatement',
          count: { type: 'NumberLiteral', value: 4, range: dummyRange },
          body: [
            {
              type: 'MoveCommand',
              command: 'FD',
              distance: { type: 'NumberLiteral', value: 100, range: dummyRange },
              range: dummyRange
            },
            {
              type: 'TurnCommand',
              command: 'RT',
              angle: { type: 'NumberLiteral', value: 90, range: dummyRange },
              range: dummyRange
            }
          ],
          range: dummyRange,
          bodyRange: dummyRange
        }
      ]
    };
    
    const context: ExecutionContext = {
      procedures: new Map(),
      callStack: [{ name: 'main', lineIndex: 0, body: program.body }],
      loopStack: [],
      turtle: { x: 0, y: 0, heading: 0, penDown: true, penColor: 'black', visible: true },
      trace: [],
      speed: 1,
      status: 'idle'
    };
    const newContext = executeProgram(program, context);
    expect(newContext.turtle.y).toBeCloseTo(0);
    expect(newContext.turtle.x).toBeCloseTo(0);
  });

  it('executes ProcedureCall with parameter substitution', () => {
    const procDef: ProcedureDefinition = {
      type: 'ProcedureDefinition',
      name: 'SQUARE',
      params: ['SIZE'],
      body: [
        {
          type: 'MoveCommand',
          command: 'FD',
          distance: { type: 'ProcedureCallExpr', procName: 'SIZE', range: dummyRange },
          range: dummyRange
        }
      ],
      range: dummyRange,
      nameRange: dummyRange
    };

    const program: Program = {
      type: 'Program',
      range: dummyRange,
      body: [
        {
          type: 'ProcedureCall',
          name: 'SQUARE',
          args: [{ type: 'NumberLiteral', value: 50, range: dummyRange }],
          range: dummyRange,
          nameRange: dummyRange
        }
      ]
    };
    
    const context: ExecutionContext = {
      procedures: new Map([['SQUARE', procDef]]),
      callStack: [{ name: 'main', lineIndex: 0, body: program.body }],
      loopStack: [],
      turtle: { x: 0, y: 0, heading: 0, penDown: true, penColor: 'black', visible: true },
      trace: [],
      speed: 1,
      status: 'idle'
    };

    const newContext = executeProgram(program, context);
    expect(newContext.turtle.y).toBeCloseTo(-50);
  });
});
