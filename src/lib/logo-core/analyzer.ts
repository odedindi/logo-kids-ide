import { ASTNode, Diagnostic, Program, ProcedureDefinition, ProcedureCall, Expression } from './types';

export function analyzeProgram(program: Program, knownProcedures: Map<string, ProcedureDefinition>): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  function visit(node: ASTNode | Expression) {
    if (!node) return;

    if (node.type === 'ProcedureCall') {
      const procCall = node as ProcedureCall;
      const procDef = knownProcedures.get(procCall.name);
      
      if (!procDef) {
        diagnostics.push({
          severity: 'error',
          message: `Undefined procedure: ${procCall.name}`,
          kidMessage: `I don't know how to ${procCall.name}. Did you misspell it or forget to teach me?`,
          range: procCall.nameRange,
          source: 'analyzer'
        });
      } else {
        if (procCall.args.length !== procDef.params.length) {
          diagnostics.push({
            severity: 'error',
            message: `Argument count mismatch for ${procCall.name}. Expected ${procDef.params.length}, got ${procCall.args.length}`,
            kidMessage: `${procCall.name} needs ${procDef.params.length} number${procDef.params.length === 1 ? '' : 's'}, but you gave ${procCall.args.length}.`,
            range: procCall.range,
            source: 'analyzer'
          });
        }
      }
      procCall.args.forEach(visit);
    } else if (node.type === 'RepeatStatement') {
      if (!node.count) {
        diagnostics.push({
          severity: 'error',
          message: 'Missing count for REPEAT',
          kidMessage: 'REPEAT needs a number to know how many times to repeat!',
          range: node.range,
          source: 'analyzer'
        });
      } else {
        visit(node.count);
      }
      if (!node.body) {
        diagnostics.push({
          severity: 'error',
          message: 'Missing brackets for REPEAT',
          kidMessage: 'Don\'t forget to put [ and ] around the commands you want to repeat!',
          range: node.range,
          source: 'analyzer'
        });
      } else {
        node.body.forEach(visit);
      }
    } else if (node.type === 'MoveCommand' || node.type === 'TurnCommand') {
      const arg = (node as any).distance || (node as any).angle;
      if (!arg) {
        diagnostics.push({
          severity: 'error',
          message: `Missing argument for ${node.command}`,
          kidMessage: `${node.command} needs a number to tell it how much to move or turn!`,
          range: node.range,
          source: 'analyzer'
        });
      } else {
        visit(arg);
      }
    } else if (node.type === 'ColorCommand') {
      if (!node.color) {
        diagnostics.push({
          severity: 'error',
          message: `Missing color for ${node.command}`,
          kidMessage: `What color should I use? Give me a number for the color!`,
          range: node.range,
          source: 'analyzer'
        });
      } else {
        visit(node.color);
      }
    } else if (node.type === 'SetXYCommand') {
      if (!node.x || !node.y) {
        diagnostics.push({
          severity: 'error',
          message: `Missing arguments for SETXY`,
          kidMessage: `SETXY needs two numbers, for X and Y!`,
          range: node.range,
          source: 'analyzer'
        });
      }
      if (node.x) visit(node.x);
      if (node.y) visit(node.y);
    } else if (node.type === 'ProcedureDefinition') {
      if (node.body === undefined || node.body === null) {
         diagnostics.push({
          severity: 'error',
          message: `Unclosed procedure definition for ${node.name}`,
          kidMessage: `You started teaching me how to ${node.name}, but forgot to say END!`,
          range: node.range,
          source: 'analyzer'
        });
      } else {
        node.body.forEach(visit);
      }
    } else if (node.type === 'BinaryExpression') {
      if (!node.left || !node.right) {
        diagnostics.push({
          severity: 'error',
          message: `Missing parts in math expression`,
          kidMessage: `Looks like a math problem is missing a number!`,
          range: node.range,
          source: 'analyzer'
        });
      }
      if (node.left) visit(node.left);
      if (node.right) visit(node.right);
    } else if (node.type === 'NumberLiteral') {
      if (node.value === undefined || isNaN(node.value)) {
        diagnostics.push({
          severity: 'error',
          message: `Invalid number`,
          kidMessage: `That doesn't look like a valid number to me!`,
          range: node.range,
          source: 'analyzer'
        });
      }
    } else if (node.type === 'WordLiteral') {
    } else if (node.type === 'PrintCommand') {
      if (node.value) visit(node.value);
    } else if (node.type === 'SetHeadingCommand') {
      if (node.angle) visit(node.angle);
    }
  }

  program.body.forEach(visit);

  return diagnostics;
}
