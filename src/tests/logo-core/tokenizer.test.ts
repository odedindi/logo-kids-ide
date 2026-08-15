import { describe, it, expect } from 'vitest';
import { tokenize } from '../../lib/logo-core/tokenizer';
import { TokenType } from '../../lib/logo-core/types';

describe('Tokenizer', () => {
  it('should tokenize an empty string', () => {
    const tokens = tokenize('');
    expect(tokens.length).toBe(1);
    expect(tokens[0].type).toBe('EOF');
  });

  it('should tokenize basic movement commands', () => {
    const tokens = tokenize('FD 100');
    expect(tokens.length).toBe(4);
    expect(tokens[0]).toMatchObject({ type: 'COMMAND', value: 'FD' });
    expect(tokens[2]).toMatchObject({ type: 'NUMBER', value: '100' });
  });

  it('should handle case insensitivity', () => {
    const tokens = tokenize('fOrWaRd 50');
    expect(tokens[0]).toMatchObject({ type: 'COMMAND', value: 'fOrWaRd' });
  });

  it('should handle brackets and parameters', () => {
    const tokens = tokenize('REPEAT 4 [ FD :size RT 90 ]');
    const types = tokens.filter(t => t.type !== 'WHITESPACE').map(t => t.type);
    expect(types).toEqual([
      'STRUCT_COMMAND', 'NUMBER', 'LBRACKET', 'COMMAND', 'PARAMETER', 'COMMAND', 'NUMBER', 'RBRACKET', 'EOF'
    ]);
  });

  it('should handle math operators and parentheses', () => {
    const tokens = tokenize('FD (50 + 50) * 2 - 10 / 5');
    const types = tokens.filter(t => t.type !== 'WHITESPACE').map(t => t.type);
    expect(types).toEqual([
      'COMMAND', 'LPAREN', 'NUMBER', 'PLUS', 'NUMBER', 'RPAREN', 'MULTIPLY', 'NUMBER', 'MINUS', 'NUMBER', 'DIVIDE', 'NUMBER', 'EOF'
    ]);
  });

  it('should handle negative numbers', () => {
    const tokens = tokenize('FD -50');
    const nonWhitespace = tokens.filter(t => t.type !== 'WHITESPACE');
    expect(nonWhitespace[0]).toMatchObject({ type: 'COMMAND' });
    expect(nonWhitespace[1]).toMatchObject({ type: 'NUMBER', value: '-50' });
  });

  it('should correctly track source locations', () => {
    const tokens = tokenize('FD 100\nRT 90');
    const fd = tokens[0];
    expect(fd.range.start).toEqual({ line: 1, col: 1, offset: 0 });
    expect(fd.range.end).toEqual({ line: 1, col: 3, offset: 2 });
    
    const rt = tokens.find(t => t.value === 'RT')!;
    expect(rt.range.start).toEqual({ line: 2, col: 1, offset: 7 });
    expect(rt.range.end).toEqual({ line: 2, col: 3, offset: 9 });
  });

  it('should handle comments', () => {
    const tokens = tokenize('FD 100 ; move forward\nRT 90');
    const nonWhitespace = tokens.filter(t => t.type !== 'WHITESPACE' && t.type !== 'NEWLINE');
    expect(nonWhitespace.map(t => t.type)).toEqual([
      'COMMAND', 'NUMBER', 'COMMENT', 'COMMAND', 'NUMBER', 'EOF'
    ]);
    expect(nonWhitespace[2].value).toBe('; move forward');
  });
});
