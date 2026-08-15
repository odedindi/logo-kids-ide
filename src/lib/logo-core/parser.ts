import {
  Token, TokenType, ASTNode, Program, MoveCommand, TurnCommand,
  PenCommand, ColorCommand, SetXYCommand, HomeCommand, ClearScreenCommand,
  RepeatStatement, ProcedureDefinition, ProcedureCall, Expression, SourceRange
} from './types';

class ParseError extends Error {
  constructor(message: string, public range: SourceRange) {
    super(message);
  }
}

export function parse(tokens: Token[]): Program {
  let current = 0;

  function peek(): Token {
    return tokens[current];
  }

  function advance(): Token {
    if (!isAtEnd()) current++;
    return tokens[current - 1];
  }

  function isAtEnd(): boolean {
    return tokens[current].type === 'EOF';
  }

  function match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (check(type)) {
        advance();
        return true;
      }
    }
    return false;
  }

  function check(type: TokenType): boolean {
    if (isAtEnd()) return false;
    return peek().type === type;
  }

  function skipWhitespace() {
    while (check('WHITESPACE') || check('NEWLINE') || check('COMMENT')) {
      advance();
    }
  }

  function createRange(start: SourceRange, end: SourceRange): SourceRange {
    return {
      start: start.start,
      end: end.end
    };
  }

  function parseExpression(precedence: number = 0): Expression {
    skipWhitespace();
    let left = parsePrefix();

    skipWhitespace();
    while (!isAtEnd()) {
      const nextType = peek().type;
      const nextPrec = getPrecedence(nextType);
      if (nextPrec <= precedence) break;
      
      const opToken = advance();
      skipWhitespace();
      const right = parseExpression(nextPrec);
      left = {
        type: nextType === 'GT' || nextType === 'LT_OP' || nextType === 'EQ' 
          ? 'ComparisonExpression' 
          : 'BinaryExpression',
        operator: opToken.value as '+' | '-' | '*' | '/' | '>' | '<' | '=',
        left,
        right,
        range: createRange(left.range, right.range)
      };
      skipWhitespace();
    }

    return left;
  }

  function getPrecedence(type: TokenType): number {
    switch (type) {
      case 'GT':
      case 'LT_OP':
      case 'EQ':
        return 0.5;
      case 'PLUS':
      case 'MINUS':
        return 1;
      case 'MULTIPLY':
      case 'DIVIDE':
        return 2;
      default:
        return 0;
    }
  }

  function parsePrefix(): Expression {
    const token = peek();
    
    if (check('NUMBER')) {
      advance();
      return {
        type: 'NumberLiteral',
        value: parseFloat(token.value),
        range: token.range
      };
    }
    
    if (check('WORD')) {
      advance();
      return {
        type: 'WordLiteral',
        word: token.value,
        range: token.range
      };
    }
    
    if (check('PARAMETER')) {
      advance();
      return {
        type: 'ProcedureCallExpr',
        procName: token.value,
        range: token.range
      };
    }

    if (check('LPAREN')) {
      advance();
      const expr = parseExpression(0);
      skipWhitespace();
      if (!check('RPAREN')) {
        throw new ParseError(`Expected ')'`, peek().range);
      }
      const rparen = advance();
      return {
        ...expr,
        range: createRange(token.range, rparen.range)
      };
    }

    if (check('PROCEDURE_NAME')) {
      throw new ParseError(`Unexpected procedure call in expression without known arity`, token.range);
    }

    throw new ParseError(`Unexpected token in expression: ${token.type}`, token.range);
  }

  function parseStatement(): ASTNode | null {
    skipWhitespace();
    if (isAtEnd()) return null;

    const token = peek();

    if (match('COMMAND')) {
      const cmd = token.value.toUpperCase();
      if (cmd === 'FD' || cmd === 'FORWARD' || cmd === 'BK' || cmd === 'BACK') {
        const expr = parseExpression();
        return {
          type: 'MoveCommand',
          command: cmd,
          distance: expr,
          range: createRange(token.range, expr.range)
        };
      }
      if (cmd === 'LT' || cmd === 'LEFT' || cmd === 'RT' || cmd === 'RIGHT') {
        const expr = parseExpression();
        return {
          type: 'TurnCommand',
          command: cmd,
          angle: expr,
          range: createRange(token.range, expr.range)
        };
      }
      if (cmd === 'PU' || cmd === 'PENUP' || cmd === 'PD' || cmd === 'PENDOWN') {
        return {
          type: 'PenCommand',
          command: cmd,
          range: token.range
        };
      }
    }

    if (match('ENV_COMMAND')) {
      const cmd = token.value.toUpperCase();
      if (cmd === 'SETPC' || cmd === 'SETPENCOLOR') {
        const expr = parseExpression();
        return {
          type: 'ColorCommand',
          command: cmd,
          color: expr,
          range: createRange(token.range, expr.range)
        };
      }
      if (cmd === 'SETXY') {
        const x = parseExpression();
        const y = parseExpression();
        return {
          type: 'SetXYCommand',
          x,
          y,
          range: createRange(token.range, y.range)
        };
      }
      if (cmd === 'SETHEADING' || cmd === 'SETH') {
        const expr = parseExpression();
        return {
          type: 'SetHeadingCommand',
          command: cmd,
          angle: expr,
          range: createRange(token.range, expr.range)
        };
      }
      if (cmd === 'PRINT' || cmd === 'PR') {
        const expr = parseExpression();
        return {
          type: 'PrintCommand',
          command: cmd,
          value: expr,
          range: createRange(token.range, expr.range)
        };
      }
      if (cmd === 'HOME') {
        return { type: 'HomeCommand', range: token.range };
      }
      if (['CS', 'CLEARSCREEN'].includes(cmd)) {
        return { type: 'ClearScreenCommand', range: token.range };
      }
    }

    if (match('STRUCT_COMMAND')) {
      const cmd = token.value.toUpperCase();
      if (cmd === 'REPEAT') {
        const count = parseExpression();
        skipWhitespace();
        if (!check('LBRACKET')) {
          throw new ParseError(`Expected '[' after REPEAT count`, peek().range);
        }
        const lbracket = advance();
        const body: ASTNode[] = [];
        
        skipWhitespace();
        while (!isAtEnd() && !check('RBRACKET')) {
          const stmt = parseStatement();
          if (stmt) body.push(stmt);
          skipWhitespace();
        }
        
        if (!check('RBRACKET')) {
          throw new ParseError(`Expected ']' to close REPEAT block`, peek().range);
        }
        const rbracket = advance();
        
        return {
          type: 'RepeatStatement',
          count,
          body,
          range: createRange(token.range, rbracket.range),
          bodyRange: createRange(lbracket.range, rbracket.range)
        };
      }

      if (cmd === 'IF') {
        const condition = parseExpression();
        skipWhitespace();
        if (!check('LBRACKET')) {
          throw new ParseError(`Expected '[' after IF condition`, peek().range);
        }
        const lbracket = advance();
        const body: ASTNode[] = [];
        
        skipWhitespace();
        while (!isAtEnd() && !check('RBRACKET')) {
          const stmt = parseStatement();
          if (stmt) body.push(stmt);
          skipWhitespace();
        }
        
        if (!check('RBRACKET')) {
          throw new ParseError(`Expected ']' to close IF block`, peek().range);
        }
        const rbracket = advance();
        
        return {
          type: 'IfStatement',
          condition,
          body,
          range: createRange(token.range, rbracket.range),
          bodyRange: createRange(lbracket.range, rbracket.range)
        };
      }

      if (cmd === 'IFELSE') {
        const condition = parseExpression();
        skipWhitespace();
        if (!check('LBRACKET')) {
          throw new ParseError(`Expected '[' after IFELSE condition`, peek().range);
        }
        const lbracket1 = advance();
        const thenBody: ASTNode[] = [];
        
        skipWhitespace();
        while (!isAtEnd() && !check('RBRACKET')) {
          const stmt = parseStatement();
          if (stmt) thenBody.push(stmt);
          skipWhitespace();
        }
        
        if (!check('RBRACKET')) {
          throw new ParseError(`Expected ']' to close IFELSE then-block`, peek().range);
        }
        const rbracket1 = advance();
        
        skipWhitespace();
        if (!check('LBRACKET')) {
          throw new ParseError(`Expected '[' for IFELSE else-block`, peek().range);
        }
        const lbracket2 = advance();
        const elseBody: ASTNode[] = [];
        
        skipWhitespace();
        while (!isAtEnd() && !check('RBRACKET')) {
          const stmt = parseStatement();
          if (stmt) elseBody.push(stmt);
          skipWhitespace();
        }
        
        if (!check('RBRACKET')) {
          throw new ParseError(`Expected ']' to close IFELSE else-block`, peek().range);
        }
        const rbracket2 = advance();
        
        return {
          type: 'IfElseStatement',
          condition,
          thenBody,
          elseBody,
          range: createRange(token.range, rbracket2.range),
          thenBodyRange: createRange(lbracket1.range, rbracket1.range),
          elseBodyRange: createRange(lbracket2.range, rbracket2.range)
        };
      }

      if (cmd === 'STOP') {
        return { type: 'StopCommand', range: token.range };
      }
      
      if (cmd === 'TO') {
        skipWhitespace();
        if (!check('PROCEDURE_NAME')) {
          throw new ParseError(`Expected procedure name after TO`, peek().range);
        }
        const nameToken = advance();
        const name = nameToken.value.toUpperCase();
        
        const params: string[] = [];
        skipWhitespace();
        while (check('PARAMETER')) {
          params.push(advance().value);
          skipWhitespace();
        }
        
        const body: ASTNode[] = [];
        skipWhitespace();
        while (!isAtEnd()) {
          if (check('STRUCT_COMMAND') && peek().value.toUpperCase() === 'END') {
            break;
          }
          const stmt = parseStatement();
          if (stmt) body.push(stmt);
          skipWhitespace();
        }
        
        if (!check('STRUCT_COMMAND') || peek().value.toUpperCase() !== 'END') {
          throw new ParseError(`Expected END to close procedure definition`, peek().range);
        }
        const endToken = advance();
        
        return {
          type: 'ProcedureDefinition',
          name,
          params,
          body,
          range: createRange(token.range, endToken.range),
          nameRange: nameToken.range
        };
      }
    }

    if (match('PROCEDURE_NAME')) {
      const name = token.value.toUpperCase();
      const args: Expression[] = [];
      
      skipWhitespace();
      while (!isAtEnd() && (check('NUMBER') || check('PARAMETER') || check('LPAREN'))) {
        args.push(parseExpression());
        skipWhitespace();
      }
      
      return {
        type: 'ProcedureCall',
        name,
        args,
        range: createRange(token.range, args.length > 0 ? args[args.length - 1].range : token.range),
        nameRange: token.range
      };
    }

    throw new ParseError(`Unexpected token: ${peek().value}`, peek().range);
  }

  const statements: ASTNode[] = [];
  skipWhitespace();
  
  const startToken = peek();

  while (!isAtEnd()) {
    const stmt = parseStatement();
    if (stmt) statements.push(stmt);
    skipWhitespace();
  }

  return {
    type: 'Program',
    body: statements,
    range: createRange(startToken.range, tokens[tokens.length - 1].range)
  };
}
