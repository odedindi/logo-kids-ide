import { ASTNode, ExecutionContext, Expression, TraceOp, TraceOpType, ProcedureDefinition, Program } from './types';

function evaluate(expr: Expression, context: ExecutionContext): number {
  if (expr.type === 'NumberLiteral') {
    return expr.value ?? 0;
  }
  if (expr.type === 'BinaryExpression') {
    const left = expr.left ? evaluate(expr.left, context) : 0;
    const right = expr.right ? evaluate(expr.right, context) : 0;
    switch (expr.operator) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return right !== 0 ? left / right : 0;
    }
  }
  if (expr.type === 'ComparisonExpression') {
    const left = expr.left ? evaluate(expr.left, context) : 0;
    const right = expr.right ? evaluate(expr.right, context) : 0;
    switch (expr.operator) {
      case '>': return left > right ? 1 : 0;
      case '<': return left < right ? 1 : 0;
      case '=': return left === right ? 1 : 0;
    }
  }
  if (expr.type === 'ProcedureCallExpr') {
    return 0;
  }
  return 0;
}

function evaluateToString(expr: Expression, context: ExecutionContext): string {
  if (expr.type === 'WordLiteral') {
    return expr.word ?? '';
  }
  return String(evaluate(expr, context));
}

function substituteParamsInExpression(expr: Expression, argsMap: Map<string, number>): Expression {
  if (expr.type === 'ProcedureCallExpr' && expr.procName && argsMap.has(expr.procName)) {
    return { ...expr, type: 'NumberLiteral', value: argsMap.get(expr.procName)! };
  }
  if (expr.type === 'WordLiteral') {
    return expr;
  }
  if (expr.type === 'BinaryExpression' || expr.type === 'ComparisonExpression') {
    return {
      ...expr,
      left: expr.left ? substituteParamsInExpression(expr.left, argsMap) : undefined,
      right: expr.right ? substituteParamsInExpression(expr.right, argsMap) : undefined
    };
  }
  return expr;
}

function substituteParamsInNode(node: ASTNode, argsMap: Map<string, number>): ASTNode {
  switch (node.type) {
    case 'MoveCommand':
      return { ...node, distance: substituteParamsInExpression(node.distance, argsMap) };
    case 'TurnCommand':
      return { ...node, angle: substituteParamsInExpression(node.angle, argsMap) };
    case 'SetXYCommand':
      return { 
        ...node, 
        x: substituteParamsInExpression(node.x, argsMap),
        y: substituteParamsInExpression(node.y, argsMap) 
      };
    case 'SetHeadingCommand':
      return { ...node, angle: substituteParamsInExpression(node.angle, argsMap) };
    case 'PrintCommand':
      return { ...node, value: substituteParamsInExpression(node.value, argsMap) };
    case 'ColorCommand':
      return { ...node, color: substituteParamsInExpression(node.color, argsMap) };
    case 'RepeatStatement':
      return { 
        ...node, 
        count: substituteParamsInExpression(node.count, argsMap),
        body: node.body.map(b => substituteParamsInNode(b, argsMap))
      };
    case 'IfStatement':
      return {
        ...node,
        condition: substituteParamsInExpression(node.condition, argsMap),
        body: node.body.map(b => substituteParamsInNode(b, argsMap))
      };
    case 'IfElseStatement':
      return {
        ...node,
        condition: substituteParamsInExpression(node.condition, argsMap),
        thenBody: node.thenBody.map(b => substituteParamsInNode(b, argsMap)),
        elseBody: node.elseBody.map(b => substituteParamsInNode(b, argsMap))
      };
    case 'ProcedureCall':
      return {
        ...node,
        args: node.args.map(a => substituteParamsInExpression(a, argsMap))
      };
    default:
      return node;
  }
}

export function executeStep(context: ExecutionContext): ExecutionContext {
  const currentStackFrame = context.callStack[context.callStack.length - 1];
  
  if (!currentStackFrame) {
    return { ...context, status: 'completed' };
  }

  const { body, lineIndex } = currentStackFrame;

  if (lineIndex >= body.length) {
    const newStack = [...context.callStack];
    newStack.pop();
    if (newStack.length === 0) {
      return { ...context, callStack: newStack, status: 'completed' };
    }
    return { ...context, callStack: newStack };
  }

  const node = body[lineIndex];
  
  currentStackFrame.lineIndex++;

  const newTurtle = { ...context.turtle };
  const newTrace = [...context.trace];

  if (node.type === 'MoveCommand') {
    const distance = evaluate(node.distance, context);
    const rad = (newTurtle.heading - 90) * (Math.PI / 180);
    const dist = node.command === 'FD' || node.command === 'FORWARD' ? distance : -distance;
    
    const oldX = newTurtle.x;
    const oldY = newTurtle.y;
    newTurtle.x += Math.cos(rad) * dist;
    newTurtle.y += Math.sin(rad) * dist;
    
    newTrace.push({
      type: newTurtle.penDown ? 'MOVE' : 'PEN_UP_MOVE',
      from: { x: oldX, y: oldY, heading: newTurtle.heading },
      to: { x: newTurtle.x, y: newTurtle.y, heading: newTurtle.heading },
      penDown: newTurtle.penDown,
      penColor: newTurtle.penColor
    });
  } else if (node.type === 'TurnCommand') {
    const angle = evaluate(node.angle, context);
    const sign = node.command === 'RT' || node.command === 'RIGHT' ? 1 : -1;
    newTurtle.heading = (newTurtle.heading + sign * angle) % 360;
    if (newTurtle.heading < 0) newTurtle.heading += 360;
  } else if (node.type === 'PenCommand') {
    newTurtle.penDown = node.command === 'PD' || node.command === 'PENDOWN';
  } else if (node.type === 'ColorCommand') {
    const val = evaluate(node.color, context);
    const colors = ['black', 'red', 'blue', 'green', 'yellow', 'purple'];
    newTurtle.penColor = colors[val % colors.length] || 'black';
  } else if (node.type === 'RepeatStatement') {
    const count = evaluate(node.count, context);
    if (count > 0) {
      context.loopStack.push({ count, current: 0, body: node.body, index: 0 });
      context.callStack.push({ name: 'repeat', lineIndex: 0, body: node.body });
    }
  } else if (node.type === 'ProcedureCall') {
    const proc = context.procedures.get(node.name);
    if (proc) {
      const argsMap = new Map<string, number>();
      for (let i = 0; i < proc.params.length; i++) {
        const val = i < node.args.length ? evaluate(node.args[i], context) : 0;
        argsMap.set(proc.params[i], val);
      }
      const substitutedBody = proc.body.map(b => substituteParamsInNode(b, argsMap));
      context.callStack.push({ name: node.name, lineIndex: 0, body: substitutedBody });
    }
  } else if (node.type === 'SetXYCommand') {
    const x = evaluate(node.x, context);
    const y = evaluate(node.y, context);
    const oldX = newTurtle.x;
    const oldY = newTurtle.y;
    newTurtle.x = x;
    newTurtle.y = y;
    newTrace.push({
      type: newTurtle.penDown ? 'MOVE' : 'PEN_UP_MOVE',
      from: { x: oldX, y: oldY, heading: newTurtle.heading },
      to: { x: newTurtle.x, y: newTurtle.y, heading: newTurtle.heading },
      penDown: newTurtle.penDown,
      penColor: newTurtle.penColor
    });
  } else if (node.type === 'HomeCommand') {
    const oldX = newTurtle.x;
    const oldY = newTurtle.y;
    newTurtle.x = 0;
    newTurtle.y = 0;
    newTurtle.heading = 0;
    newTrace.push({
      type: newTurtle.penDown ? 'MOVE' : 'PEN_UP_MOVE',
      from: { x: oldX, y: oldY, heading: newTurtle.heading },
      to: { x: newTurtle.x, y: newTurtle.y, heading: newTurtle.heading },
      penDown: newTurtle.penDown,
      penColor: newTurtle.penColor
    });
  } else if (node.type === 'ClearScreenCommand') {
    newTurtle.x = 0;
    newTurtle.y = 0;
    newTurtle.heading = 0;
    newTrace.push({
      type: 'CLEAR',
      from: { x: 0, y: 0, heading: 0 },
      to: { x: 0, y: 0, heading: 0 },
      penDown: newTurtle.penDown,
      penColor: newTurtle.penColor
    });
  } else if (node.type === 'SetHeadingCommand') {
    const angle = evaluate(node.angle, context);
    newTurtle.heading = angle % 360;
    if (newTurtle.heading < 0) newTurtle.heading += 360;
  } else if (node.type === 'PrintCommand') {
    const val = evaluateToString(node.value, context);
    console.log(`[Logo PRINT] ${val}`);
  } else if (node.type === 'StopCommand') {
    if (context.callStack.length > 1) {
      context.callStack.pop();
    }
    return { ...context, turtle: newTurtle, trace: newTrace };
  } else if (node.type === 'IfStatement') {
    const condResult = evaluate(node.condition, context);
    if (condResult !== 0) {
      context.callStack.push({ name: 'if', lineIndex: 0, body: node.body });
    }
    return { ...context, turtle: newTurtle, trace: newTrace };
  } else if (node.type === 'IfElseStatement') {
    const condResult = evaluate(node.condition, context);
    if (condResult !== 0) {
      context.callStack.push({ name: 'if', lineIndex: 0, body: node.thenBody });
    } else {
      context.callStack.push({ name: 'if', lineIndex: 0, body: node.elseBody });
    }
    return { ...context, turtle: newTurtle, trace: newTrace };
  }

  if (context.callStack[context.callStack.length - 1]?.name === 'repeat') {
    const loopFrame = context.callStack[context.callStack.length - 1];
    if (loopFrame.lineIndex >= loopFrame.body.length) {
      const topLoop = context.loopStack[context.loopStack.length - 1];
      if (topLoop) {
        topLoop.current++;
        if (topLoop.current >= topLoop.count) {
          context.loopStack.pop();
          context.callStack.pop();
        } else {
          loopFrame.lineIndex = 0;
        }
      }
    }
  }

  return { ...context, turtle: newTurtle, trace: newTrace };
}

export function executeProgram(program: Program, context: ExecutionContext): ExecutionContext {
  let ctx = { ...context };
  ctx.callStack = [{ name: 'main', lineIndex: 0, body: program.body }];
  ctx.status = 'running';
  
  while (ctx.status === 'running') {
    ctx = executeStep(ctx);
    if (ctx.callStack.length === 0) {
      ctx.status = 'completed';
    }
  }
  
  return ctx;
}
