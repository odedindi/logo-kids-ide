import { describe, it, expect } from 'vitest';
import { parse } from '../../lib/logo-core/parser';
import { tokenize } from '../../lib/logo-core/tokenizer';

describe('Parser', () => {
  it('should parse an empty program', () => {
    const tokens = tokenize('');
    const ast = parse(tokens);
    expect(ast.type).toBe('Program');
    expect(ast.body.length).toBe(0);
  });

  it('should parse simple movement commands', () => {
    const tokens = tokenize('FD 100 RT 90');
    const ast = parse(tokens);
    expect(ast.body.length).toBe(2);
    expect(ast.body[0]).toMatchObject({
      type: 'MoveCommand',
      command: 'FD',
      distance: { type: 'NumberLiteral', value: 100 }
    });
    expect(ast.body[1]).toMatchObject({
      type: 'TurnCommand',
      command: 'RT',
      angle: { type: 'NumberLiteral', value: 90 }
    });
  });

  it('should parse expressions with precedence', () => {
    const tokens = tokenize('FD 10 + 20 * 2');
    const ast = parse(tokens);
    expect(ast.body[0].type).toBe('MoveCommand');
    if (ast.body[0].type !== 'MoveCommand') return;
    const expr = ast.body[0].distance;
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type !== 'BinaryExpression') return;
    expect(expr.operator).toBe('+');
    
    expect(expr.left!.type).toBe('NumberLiteral');
    if (expr.left!.type !== 'NumberLiteral') return;
    expect(expr.left!.value).toBe(10);
    
    expect(expr.right!.type).toBe('BinaryExpression');
    if (expr.right!.type !== 'BinaryExpression') return;
    expect(expr.right!.operator).toBe('*');
    
    expect(expr.right!.left!.type).toBe('NumberLiteral');
    if (expr.right!.left!.type !== 'NumberLiteral') return;
    expect(expr.right!.left!.value).toBe(20);
    
    expect(expr.right!.right!.type).toBe('NumberLiteral');
    if (expr.right!.right!.type !== 'NumberLiteral') return;
    expect(expr.right!.right!.value).toBe(2);
  });

  it('should parse parentheses in expressions', () => {
    const tokens = tokenize('FD (10 + 20) * 2');
    const ast = parse(tokens);
    expect(ast.body[0].type).toBe('MoveCommand');
    if (ast.body[0].type !== 'MoveCommand') return;
    const expr = ast.body[0].distance;
    expect(expr.type).toBe('BinaryExpression');
    if (expr.type !== 'BinaryExpression') return;
    expect(expr.operator).toBe('*');
    
    expect(expr.left!.type).toBe('BinaryExpression');
    if (expr.left!.type !== 'BinaryExpression') return;
    expect(expr.left!.operator).toBe('+');
  });

  it('should parse repeat blocks', () => {
    const tokens = tokenize('REPEAT 4 [ FD 100 RT 90 ]');
    const ast = parse(tokens);
    expect(ast.body.length).toBe(1);
    expect(ast.body[0]).toMatchObject({
      type: 'RepeatStatement',
      count: { type: 'NumberLiteral', value: 4 }
    });
    expect(ast.body[0].type).toBe('RepeatStatement');
    if (ast.body[0].type !== 'RepeatStatement') return;
    const repeat = ast.body[0];
    expect(repeat.body.length).toBe(2);
    expect(repeat.body[0].type).toBe('MoveCommand');
  });

  it('should parse procedure definitions', () => {
    const tokens = tokenize('TO SQUARE :SIZE REPEAT 4 [ FD :SIZE RT 90 ] END');
    const ast = parse(tokens);
    expect(ast.body.length).toBe(1);
    expect(ast.body[0]).toMatchObject({
      type: 'ProcedureDefinition',
      name: 'SQUARE',
      params: ['SIZE']
    });
  });

  it('should parse procedure calls with args', () => {
    const tokens = tokenize('SQUARE 100 :SIZE');
    const ast = parse(tokens);
    expect(ast.body.length).toBe(1);
    expect(ast.body[0]).toMatchObject({
      type: 'ProcedureCall',
      name: 'SQUARE',
      args: [
        { type: 'NumberLiteral', value: 100 },
        { type: 'ProcedureCallExpr', procName: 'SIZE' }
      ]
    });
  });
});
