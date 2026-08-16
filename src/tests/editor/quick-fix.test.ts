import { describe, it, expect } from 'vitest';
import {
  computeQuickFixes,
  applyQuickFix,
  applyAllQuickFixes,
  lowercaseKeywordDiagnostics,
} from '../../lib/editor/quick-fix';

describe('quick-fix', () => {
  describe('lowercase keywords', () => {
    it('uppercases a lowercase command', () => {
      const fixes = computeQuickFixes('fd 100');
      const fix = fixes.find((f) => f.kind === 'uppercase-keyword');
      expect(fix).toBeDefined();
      expect(fix!.label).toBe('Make it FD');
      expect(applyQuickFix('fd 100', fix!)).toBe('FD 100');
    });

    it('uppercases every lowercase keyword in a program', () => {
      expect(applyAllQuickFixes('repeat 4 [ fd 100 rt 90 ]')).toBe('REPEAT 4 [ FD 100 RT 90 ]');
    });

    it('does not uppercase already-uppercase keywords', () => {
      const fixes = computeQuickFixes('FD 100');
      expect(fixes.filter((f) => f.kind === 'uppercase-keyword')).toHaveLength(0);
    });

    it('does not uppercase procedure names', () => {
      const fixes = computeQuickFixes('TO square\n  FD 100\nEND\nsquare');
      expect(fixes.filter((f) => f.kind === 'uppercase-keyword')).toHaveLength(0);
    });

    it('reports lowercase keywords as warning diagnostics', () => {
      const diags = lowercaseKeywordDiagnostics('fd 100');
      expect(diags.length).toBe(1);
      expect(diags[0].severity).toBe('warning');
      expect(diags[0].range.start.offset).toBe(0);
    });
  });

  describe('missing arguments', () => {
    it('adds a default number to a bare FD', () => {
      const fixes = computeQuickFixes('FD');
      const fix = fixes.find((f) => f.kind === 'missing-argument');
      expect(fix).toBeDefined();
      expect(applyQuickFix('FD', fix!)).toBe('FD 50');
    });

    it('adds a default angle to a bare RT', () => {
      const fixes = computeQuickFixes('RT');
      const fix = fixes.find((f) => f.kind === 'missing-argument');
      expect(fix).toBeDefined();
      expect(applyQuickFix('RT', fix!)).toBe('RT 90');
    });

    it('adds a default color to a bare SETPC', () => {
      const fixes = computeQuickFixes('SETPC');
      const fix = fixes.find((f) => f.kind === 'missing-argument');
      expect(fix).toBeDefined();
      expect(applyQuickFix('SETPC', fix!)).toBe('SETPC 1');
    });

    it('adds both coordinates to a bare SETXY', () => {
      const fixes = computeQuickFixes('SETXY');
      const fix = fixes.find((f) => f.kind === 'missing-argument');
      expect(fix).toBeDefined();
      expect(applyQuickFix('SETXY', fix!)).toBe('SETXY 0 0');
    });

    it('adds the missing second coordinate to SETXY with one arg', () => {
      const fixes = computeQuickFixes('SETXY 100');
      const fix = fixes.find((f) => f.kind === 'missing-argument');
      expect(fix).toBeDefined();
      expect(applyQuickFix('SETXY 100', fix!)).toBe('SETXY 100 0');
    });

    it('adds a default count to a bare REPEAT', () => {
      const fixes = computeQuickFixes('REPEAT');
      const fix = fixes.find((f) => f.kind === 'missing-argument');
      expect(fix).toBeDefined();
      expect(applyQuickFix('REPEAT', fix!)).toBe('REPEAT 4');
    });

    it('adds a zero after a dangling operator', () => {
      const fixes = computeQuickFixes('FD 5 +');
      const fix = fixes.find((f) => f.kind === 'missing-argument');
      expect(fix).toBeDefined();
      expect(applyQuickFix('FD 5 +', fix!)).toBe('FD 5 + 0');
    });

    it('adds a default when a command is followed by another command', () => {
      const fixes = computeQuickFixes('FD\nRT 90');
      const fix = fixes.find((f) => f.kind === 'missing-argument');
      expect(fix).toBeDefined();
      expect(applyQuickFix('FD\nRT 90', fix!)).toBe('FD 50\nRT 90');
    });

    it('replaces a word argument with a default number', () => {
      const fixes = computeQuickFixes('FD abc');
      const fix = fixes.find((f) => f.kind === 'bad-argument-word');
      expect(fix).toBeDefined();
      expect(applyQuickFix('FD abc', fix!)).toBe('FD 50');
    });
  });

  describe('missing brackets', () => {
    it('wraps the rest of the line in brackets for REPEAT', () => {
      const fixes = computeQuickFixes('REPEAT 4 FD 100 RT 90');
      const fix = fixes.find((f) => f.kind === 'missing-brackets');
      expect(fix).toBeDefined();
      expect(applyQuickFix('REPEAT 4 FD 100 RT 90', fix!)).toBe('REPEAT 4 [ FD 100 RT 90 ]');
    });

    it('closes an unclosed REPEAT block', () => {
      const fixes = computeQuickFixes('REPEAT 4 [ FD 100 RT 90');
      const fix = fixes.find((f) => f.kind === 'unclosed-brackets');
      expect(fix).toBeDefined();
      expect(applyQuickFix('REPEAT 4 [ FD 100 RT 90', fix!)).toBe('REPEAT 4 [ FD 100 RT 90 ]');
    });

    it('wraps the rest of the line in brackets for IF', () => {
      const fixes = computeQuickFixes('IF 5 > 3 FD 100');
      const fix = fixes.find((f) => f.kind === 'missing-brackets');
      expect(fix).toBeDefined();
      expect(applyQuickFix('IF 5 > 3 FD 100', fix!)).toBe('IF 5 > 3 [ FD 100 ]');
    });

    it('closes an unclosed IF block', () => {
      const fixes = computeQuickFixes('IF 5 > 3 [ FD 100');
      const fix = fixes.find((f) => f.kind === 'unclosed-brackets');
      expect(fix).toBeDefined();
      expect(applyQuickFix('IF 5 > 3 [ FD 100', fix!)).toBe('IF 5 > 3 [ FD 100 ]');
    });
  });

  describe('missing END', () => {
    it('appends END to an unclosed procedure', () => {
      const fixes = computeQuickFixes('TO SQUARE\n  FD 100');
      const fix = fixes.find((f) => f.kind === 'missing-end');
      expect(fix).toBeDefined();
      expect(applyQuickFix('TO SQUARE\n  FD 100', fix!)).toBe('TO SQUARE\n  FD 100\nEND');
    });
  });

  describe('missing parentheses', () => {
    it('closes an unclosed parenthesis', () => {
      const fixes = computeQuickFixes('FD (5 + 3');
      const fix = fixes.find((f) => f.kind === 'missing-paren');
      expect(fix).toBeDefined();
      expect(applyQuickFix('FD (5 + 3', fix!)).toBe('FD (5 + 3)');
    });
  });

  describe('undefined procedures', () => {
    it('suggests the closest command for a misspelled command', () => {
      const fixes = computeQuickFixes('FWD 100');
      const fix = fixes.find((f) => f.kind === 'undefined-procedure');
      expect(fix).toBeDefined();
      expect(fix!.label).toContain('FD');
      expect(applyQuickFix('FWD 100', fix!)).toBe('FD 100');
    });

    it('corrects FORWAD to FORWARD', () => {
      const fixes = computeQuickFixes('FORWAD 50');
      const fix = fixes.find((f) => f.kind === 'undefined-procedure');
      expect(fix).toBeDefined();
      expect(applyQuickFix('FORWAD 50', fix!)).toBe('FORWARD 50');
    });

    it('does not offer a fix for an unknown procedure name', () => {
      const fixes = computeQuickFixes('SQUARE');
      expect(fixes.find((f) => f.kind === 'undefined-procedure')).toBeUndefined();
    });
  });

  describe('argument count', () => {
    it('adds a default argument when too few are given', () => {
      const code = 'TO SQUARE :SIZE\n  FD :SIZE\nEND\n\nSQUARE';
      const fixes = computeQuickFixes(code);
      const fix = fixes.find((f) => f.kind === 'arg-count-too-few');
      expect(fix).toBeDefined();
      expect(applyQuickFix(code, fix!)).toBe('TO SQUARE :SIZE\n  FD :SIZE\nEND\n\nSQUARE 50');
    });

    it('removes extra arguments when too many are given', () => {
      const code = 'TO SQUARE :SIZE\n  FD :SIZE\nEND\n\nSQUARE 50 60';
      const fixes = computeQuickFixes(code);
      const fix = fixes.find((f) => f.kind === 'arg-count-too-many');
      expect(fix).toBeDefined();
      expect(applyQuickFix(code, fix!)).toBe('TO SQUARE :SIZE\n  FD :SIZE\nEND\n\nSQUARE 50 ');
    });

    it('does not flag a correct argument count', () => {
      const code = 'TO SQUARE :SIZE\n  FD :SIZE\nEND\n\nSQUARE 50';
      const fixes = computeQuickFixes(code);
      expect(fixes.find((f) => f.kind.startsWith('arg-count'))).toBeUndefined();
    });
  });

  describe('applyAllQuickFixes', () => {
    it('fixes multiple issues in one pass', () => {
      const code = 'repeat 4 fd 100 rt 90';
      expect(applyAllQuickFixes(code)).toBe('REPEAT 4 [ FD 100 RT 90 ]');
    });

    it('leaves valid code unchanged', () => {
      const code = 'REPEAT 4 [ FD 100 RT 90 ]';
      expect(applyAllQuickFixes(code)).toBe(code);
    });

    it('fixes a lowercase keyword and a missing argument together', () => {
      expect(applyAllQuickFixes('fd')).toBe('FD 50');
    });

    it('fixes an unclosed procedure with lowercase commands', () => {
      expect(applyAllQuickFixes('to square\n  fd 100')).toBe('TO square\n  FD 100\nEND');
    });

    it('fixes a misspelled command and missing brackets together', () => {
      expect(applyAllQuickFixes('repeat 4 fwd 100')).toBe('REPEAT 4 [ FD 100 ]');
    });

    it('produces code that parses after fixing', () => {
      const fixed = applyAllQuickFixes('repeat 4 [ fd 100 rt 90');
      expect(fixed).toBe('REPEAT 4 [ FD 100 RT 90 ]');
    });
  });

  describe('stable ranges', () => {
    it('fixes only touch their own range', () => {
      const fixes = computeQuickFixes('FD\nREPEAT 4 [ FD 100 RT 90\nLT 90');
      for (const fix of fixes) {
        const applied = applyQuickFix('FD\nREPEAT 4 [ FD 100 RT 90\nLT 90', fix);
        expect(applied.length).toBeGreaterThan(0);
        expect(applied).not.toContain('\u0000');
      }
    });
  });
});
