import { describe, it, expect } from 'vitest';
import { validateChallenge } from '../../lib/education/validation';
import { challenges } from '../../lib/education/content';
import type { Challenge } from '../../lib/education/content';

function byId(id: string): Challenge {
  const challenge = challenges.find((c) => c.id === id);
  if (!challenge) throw new Error(`Challenge not found: ${id}`);
  return challenge;
}

describe('validateChallenge', () => {
  describe('drawing-based challenges', () => {
    it('accepts the exact solution for draw-square', () => {
      const result = validateChallenge('REPEAT 4 [ FD 100 RT 90 ]', byId('draw-square'));
      expect(result.success).toBe(true);
      expect(result.kind).toBe('success');
    });

    it('accepts an unrolled square', () => {
      const result = validateChallenge(
        'FD 100 RT 90\nFD 100 RT 90\nFD 100 RT 90\nFD 100',
        byId('draw-square')
      );
      expect(result.success).toBe(true);
    });

    it('accepts a square drawn via a procedure', () => {
      const result = validateChallenge(
        'TO SQUARE\n  REPEAT 4 [ FD 100 RT 90 ]\nEND\n\nSQUARE',
        byId('draw-square')
      );
      expect(result.success).toBe(true);
    });

    it('accepts a counter-clockwise square (LT instead of RT)', () => {
      const result = validateChallenge('REPEAT 4 [ FD 100 LT 90 ]', byId('draw-square'));
      expect(result.success).toBe(true);
    });

    it('is case and whitespace insensitive', () => {
      const result = validateChallenge('repeat 4 [ fd 100 rt 90 ]', byId('draw-square'));
      expect(result.success).toBe(true);
    });

    it('accepts a square with a trailing HOME no-op', () => {
      const result = validateChallenge('REPEAT 4 [ FD 100 RT 90 ]\nHOME', byId('draw-square'));
      expect(result.success).toBe(true);
    });

    it('rejects a hexagon as a square', () => {
      const result = validateChallenge('REPEAT 6 [ FD 80 RT 60 ]', byId('draw-square'));
      expect(result.success).toBe(false);
      expect(result.kind).toBe('wrong-drawing');
    });

    it('rejects a triangle as a square', () => {
      const result = validateChallenge('REPEAT 3 [ FD 100 RT 120 ]', byId('draw-square'));
      expect(result.success).toBe(false);
    });

    it('rejects a square with extra drawing at the end', () => {
      const result = validateChallenge('REPEAT 4 [ FD 100 RT 90 ]\nFD 50', byId('draw-square'));
      expect(result.success).toBe(false);
      expect(result.kind).toBe('wrong-drawing');
    });

    it('rejects empty code', () => {
      const result = validateChallenge('', byId('draw-square'));
      expect(result.success).toBe(false);
      expect(result.kind).toBe('no-drawing');
    });

    it('rejects code that does not parse', () => {
      const result = validateChallenge('FD', byId('draw-square'));
      expect(result.success).toBe(false);
      expect(result.kind).toBe('code-error');
    });

    it('rejects a program that never finishes', () => {
      const result = validateChallenge('REPEAT 1000000 [ FD 1 RT 91 ]', byId('draw-square'));
      expect(result.success).toBe(false);
      expect(result.kind).toBe('too-many-steps');
    });

    it('accepts the exact solution for every shape challenge', () => {
      const cases: [string, string][] = [
        ['draw-triangle', 'REPEAT 3 [ FD 100 RT 120 ]'],
        ['draw-star', 'REPEAT 5 [ FD 150 RT 144 ]'],
        ['draw-hexagon', 'REPEAT 6 [ FD 80 RT 60 ]'],
        ['draw-diamond', 'REPEAT 2 [ FD 120 RT 60 FD 120 RT 120 ]'],
      ];
      for (const [id, code] of cases) {
        expect(validateChallenge(code, byId(id)).success, id).toBe(true);
      }
    });
  });

  describe('presence-based challenges', () => {
    it('accepts a colorful shape that uses SETPC and draws', () => {
      const result = validateChallenge(
        'SETPC 1\nREPEAT 4 [ FD 100 RT 90 ]',
        byId('colorful-shape')
      );
      expect(result.success).toBe(true);
    });

    it('rejects a drawing without SETPC', () => {
      const result = validateChallenge('REPEAT 4 [ FD 100 RT 90 ]', byId('colorful-shape'));
      expect(result.success).toBe(false);
      expect(result.kind).toBe('missing-command');
    });

    it('rejects SETPC with nothing drawn', () => {
      const result = validateChallenge('SETPC 1', byId('colorful-shape'));
      expect(result.success).toBe(false);
      expect(result.kind).toBe('no-drawing');
    });

    it('accepts a recursive BRANCH tree that draws', () => {
      const tree = [
        'TO BRANCH :SIZE',
        '  IF :SIZE < 10 [ STOP ]',
        '  FD :SIZE',
        '  RT 30',
        '  BRANCH :SIZE - 20',
        '  LT 60',
        '  BRANCH :SIZE - 20',
        '  RT 30',
        '  BK :SIZE',
        'END',
        '',
        'BRANCH 60',
      ].join('\n');
      const result = validateChallenge(tree, byId('draw-tree'));
      expect(result.success).toBe(true);
    });

    it('rejects a non-recursive BRANCH procedure', () => {
      const result = validateChallenge('TO BRANCH\n  FD 100\nEND\n\nBRANCH', byId('draw-tree'));
      expect(result.success).toBe(false);
      expect(result.kind).toBe('missing-recursion');
    });

    it('rejects a recursive procedure that is never called', () => {
      const code = [
        'TO BRANCH :SIZE',
        '  IF :SIZE < 10 [ STOP ]',
        '  BRANCH :SIZE - 20',
        'END',
      ].join('\n');
      const result = validateChallenge(code, byId('draw-tree'));
      expect(result.success).toBe(false);
      expect(result.kind).toBe('procedure-not-invoked');
    });

    it('rejects a recursive BRANCH that draws nothing', () => {
      const code = [
        'TO BRANCH :SIZE',
        '  BRANCH :SIZE - 20',
        'END',
        '',
        'BRANCH 60',
      ].join('\n');
      const result = validateChallenge(code, byId('draw-tree'));
      expect(result.success).toBe(false);
      expect(result.kind).toBe('no-drawing');
    });
  });

  describe('recursive-procedure challenges', () => {
    it('accepts a recursive SPIRAL with a stop guard', () => {
      const spiral = [
        'TO SPIRAL :SIZE',
        '  IF :SIZE > 150 [ STOP ]',
        '  FD :SIZE',
        '  RT 91',
        '  SPIRAL :SIZE + 2',
        'END',
        '',
        'SPIRAL 5',
      ].join('\n');
      const result = validateChallenge(spiral, byId('draw-spiral'));
      expect(result.success).toBe(true);
    });

    it('accepts an infinitely drawing SPIRAL (matches the reference solution)', () => {
      const spiral = [
        'TO SPIRAL :SIZE',
        '  FD :SIZE',
        '  RT 91',
        '  SPIRAL :SIZE + 10',
        'END',
        '',
        'SPIRAL 10',
      ].join('\n');
      const result = validateChallenge(spiral, byId('draw-spiral'));
      expect(result.success).toBe(true);
    });

    it('rejects code without the SPIRAL procedure', () => {
      const result = validateChallenge('FD 100', byId('draw-spiral'));
      expect(result.success).toBe(false);
      expect(result.kind).toBe('missing-procedure');
    });
  });
});
