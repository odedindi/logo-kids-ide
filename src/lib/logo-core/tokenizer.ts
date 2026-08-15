import { Token, TokenType, COMMAND_KEYWORDS, SourceLocation, SourceRange } from './types';

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let current = 0;
  let line = 1;
  let col = 1;

  function createRange(startOffset: number, startLine: number, startCol: number, endOffset: number, endLine: number, endCol: number): SourceRange {
    return {
      start: { line: startLine, col: startCol, offset: startOffset },
      end: { line: endLine, col: endCol, offset: endOffset }
    };
  }

  while (current < input.length) {
    let char = input[current];

    const startOffset = current;
    const startLine = line;
    const startCol = col;

    if (char === '\n') {
      tokens.push({
        type: 'NEWLINE',
        value: char,
        range: createRange(startOffset, startLine, startCol, current + 1, line + 1, 1)
      });
      current++;
      line++;
      col = 1;
      continue;
    }

    if (/\s/.test(char)) {
      let value = '';
      while (current < input.length && /\s/.test(input[current]) && input[current] !== '\n') {
        value += input[current];
        current++;
        col++;
      }
      tokens.push({
        type: 'WHITESPACE',
        value,
        range: createRange(startOffset, startLine, startCol, current, line, col)
      });
      continue;
    }

    if (char === ';') {
      let value = '';
      while (current < input.length && input[current] !== '\n') {
        value += input[current];
        current++;
        col++;
      }
      tokens.push({
        type: 'COMMENT',
        value,
        range: createRange(startOffset, startLine, startCol, current, line, col)
      });
      continue;
    }

    if (char === '[') {
      tokens.push({ type: 'LBRACKET', value: char, range: createRange(startOffset, startLine, startCol, current + 1, line, col + 1) });
      current++;
      col++;
      continue;
    }
    if (char === ']') {
      tokens.push({ type: 'RBRACKET', value: char, range: createRange(startOffset, startLine, startCol, current + 1, line, col + 1) });
      current++;
      col++;
      continue;
    }
    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: char, range: createRange(startOffset, startLine, startCol, current + 1, line, col + 1) });
      current++;
      col++;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: char, range: createRange(startOffset, startLine, startCol, current + 1, line, col + 1) });
      current++;
      col++;
      continue;
    }
    if (char === '+') {
      tokens.push({ type: 'PLUS', value: char, range: createRange(startOffset, startLine, startCol, current + 1, line, col + 1) });
      current++;
      col++;
      continue;
    }
    if (char === '>' && current + 1 < input.length && input[current + 1] !== '=') {
      tokens.push({ type: 'GT', value: char, range: createRange(startOffset, startLine, startCol, current + 1, line, col + 1) });
      current++;
      col++;
      continue;
    }
    if (char === '<' && current + 1 < input.length && input[current + 1] !== '=') {
      tokens.push({ type: 'LT_OP', value: char, range: createRange(startOffset, startLine, startCol, current + 1, line, col + 1) });
      current++;
      col++;
      continue;
    }
    if (char === '=' && current + 1 < input.length && input[current + 1] !== '=' && input[current - 1] !== '<' && input[current - 1] !== '>') {
      tokens.push({ type: 'EQ', value: char, range: createRange(startOffset, startLine, startCol, current + 1, line, col + 1) });
      current++;
      col++;
      continue;
    }
    if (char === '*') {
      tokens.push({ type: 'MULTIPLY', value: char, range: createRange(startOffset, startLine, startCol, current + 1, line, col + 1) });
      current++;
      col++;
      continue;
    }
    if (char === '/') {
      tokens.push({ type: 'DIVIDE', value: char, range: createRange(startOffset, startLine, startCol, current + 1, line, col + 1) });
      current++;
      col++;
      continue;
    }

    if (char === '-') {
      let isNegativeNumber = false;
      let nextIdx = current + 1;
      if (nextIdx < input.length && /[0-9.]/.test(input[nextIdx])) {
        let prevIdx = tokens.length - 1;
        while (prevIdx >= 0 && (tokens[prevIdx].type === 'WHITESPACE' || tokens[prevIdx].type === 'NEWLINE')) {
          prevIdx--;
        }
        
        const prevTokenType = prevIdx >= 0 ? tokens[prevIdx].type : null;
        
        if (!prevTokenType || ['COMMAND', 'STRUCT_COMMAND', 'ENV_COMMAND', 'LBRACKET', 'LPAREN', 'PLUS', 'MINUS', 'MULTIPLY', 'DIVIDE'].includes(prevTokenType)) {
            isNegativeNumber = true;
        }
      }

      if (isNegativeNumber) {
        let value = '-';
        current++;
        col++;
        while (current < input.length && /[0-9.]/.test(input[current])) {
          value += input[current];
          current++;
          col++;
        }
        tokens.push({
          type: 'NUMBER',
          value,
          range: createRange(startOffset, startLine, startCol, current, line, col)
        });
        continue;
      } else {
        tokens.push({ type: 'MINUS', value: char, range: createRange(startOffset, startLine, startCol, current + 1, line, col + 1) });
        current++;
        col++;
        continue;
      }
    }

    if (/[0-9.]/.test(char)) {
      let value = '';
      while (current < input.length && /[0-9.]/.test(input[current])) {
        value += input[current];
        current++;
        col++;
      }
      tokens.push({
        type: 'NUMBER',
        value,
        range: createRange(startOffset, startLine, startCol, current, line, col)
      });
      continue;
    }

    if (char === ':') {
      let value = '';
      current++;
      col++;
      while (current < input.length && /[a-zA-Z0-9_]/.test(input[current])) {
        value += input[current];
        current++;
        col++;
      }
      tokens.push({
        type: 'PARAMETER',
        value,
        range: createRange(startOffset, startLine, startCol, current, line, col)
      });
      continue;
    }

    // In Logo, " is a quoting prefix: "hello → literal word "hello"
    if (char === '"') {
      current++;
      col++;
      let value = '';
      while (current < input.length && /[a-zA-Z0-9_]/.test(input[current])) {
        value += input[current];
        current++;
        col++;
      }
      tokens.push({
        type: 'WORD',
        value: value || '"',
        range: createRange(startOffset, startLine, startCol, current, line, col)
      });
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      let value = '';
      while (current < input.length && /[a-zA-Z0-9_]/.test(input[current])) {
        value += input[current];
        current++;
        col++;
      }
      
      const upperValue = value.toUpperCase();
      let type: TokenType = 'PROCEDURE_NAME';
      
      if (COMMAND_KEYWORDS[upperValue]) {
        type = COMMAND_KEYWORDS[upperValue] as TokenType;
      }
      
      tokens.push({
        type,
        value,
        range: createRange(startOffset, startLine, startCol, current, line, col)
      });
      continue;
    }

    tokens.push({
      type: 'PROCEDURE_NAME',
      value: char,
      range: createRange(startOffset, startLine, startCol, current + 1, line, col + 1)
    });
    current++;
    col++;
  }

  tokens.push({
    type: 'EOF',
    value: '',
    range: createRange(current, line, col, current, line, col)
  });

  return tokens;
}
