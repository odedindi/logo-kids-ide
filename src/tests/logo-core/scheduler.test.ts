import { describe, it, expect } from 'vitest';
import { LogoScheduler } from '../../lib/logo-core/scheduler';
import { Program } from '../../lib/logo-core/types';

const dummyRange = { start: { line: 1, col: 1, offset: 0 }, end: { line: 1, col: 5, offset: 4 } };

describe('LogoScheduler', () => {
  it('can step through a program', () => {
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
    
    const scheduler = new LogoScheduler();
    scheduler.load(program);
    expect(scheduler.getStatus()).toBe('idle');
    
    scheduler.step();
    scheduler.step();
    expect(scheduler.getStatus()).toBe('completed');
    
    const trace = scheduler.getTrace();
    expect(trace.length).toBe(1);
    expect(trace[0].type).toBe('MOVE');
  });

  it('can reset', () => {
    const scheduler = new LogoScheduler();
    scheduler.reset();
    expect(scheduler.getStatus()).toBe('idle');
    expect(scheduler.getTrace().length).toBe(0);
  });
});
