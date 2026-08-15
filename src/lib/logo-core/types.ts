export interface SourceLocation {
  line: number;
  col: number;
  offset: number;
}

export interface SourceRange {
  start: SourceLocation;
  end: SourceLocation;
}

export type TokenType =
  | 'COMMAND'
  | 'STRUCT_COMMAND'
  | 'ENV_COMMAND'
  | 'NUMBER'
  | 'WORD'
  | 'PROCEDURE_NAME'
  | 'PARAMETER'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'PLUS'
  | 'MINUS'
  | 'MULTIPLY'
  | 'DIVIDE'
  | 'LPAREN'
  | 'RPAREN'
  | 'GT'
  | 'LT_OP'
  | 'EQ'
  | 'NEWLINE'
  | 'EOF'
  | 'COMMENT'
  | 'WHITESPACE';

export const COMMAND_KEYWORDS: Record<string, string> = {
  FD: 'COMMAND', FORWARD: 'COMMAND', BK: 'COMMAND', BACK: 'COMMAND',
  LT: 'COMMAND', LEFT: 'COMMAND', RT: 'COMMAND', RIGHT: 'COMMAND',
  PU: 'COMMAND', PENUP: 'COMMAND', PD: 'COMMAND', PENDOWN: 'COMMAND',
  REPEAT: 'STRUCT_COMMAND', TO: 'STRUCT_COMMAND', END: 'STRUCT_COMMAND',
  IF: 'STRUCT_COMMAND', IFELSE: 'STRUCT_COMMAND', STOP: 'STRUCT_COMMAND',
  SETPC: 'ENV_COMMAND', SETPENCOLOR: 'ENV_COMMAND', SETXY: 'ENV_COMMAND',
  SETHEADING: 'ENV_COMMAND', SETH: 'ENV_COMMAND',
  HOME: 'ENV_COMMAND', CS: 'ENV_COMMAND', CLEARSCREEN: 'ENV_COMMAND',
  PRINT: 'ENV_COMMAND', PR: 'ENV_COMMAND',
};

export const MOVE_COMMANDS = new Set(['FD', 'FORWARD', 'BK', 'BACK']);
export const TURN_COMMANDS = new Set(['LT', 'LEFT', 'RT', 'RIGHT']);
export const PEN_COMMANDS = new Set(['PU', 'PENUP', 'PD', 'PENDOWN']);
export const ENV_COMMANDS = new Set(['SETPC', 'SETPENCOLOR', 'SETXY', 'SETHEADING', 'SETH', 'HOME', 'CS', 'CLEARSCREEN', 'PRINT', 'PR']);
export const STRUCT_COMMANDS = new Set(['REPEAT', 'TO', 'END', 'IF', 'IFELSE', 'STOP']);

export interface Token {
  type: TokenType;
  value: string;
  range: SourceRange;
}

export type ASTNode =
  | Program
  | MoveCommand
  | PenCommand
  | ColorCommand
  | TurnCommand
  | SetXYCommand
  | SetHeadingCommand
  | HomeCommand
  | ClearScreenCommand
  | PrintCommand
  | RepeatStatement
  | IfStatement
  | IfElseStatement
  | StopCommand
  | ProcedureDefinition
  | ProcedureCall;

export interface Program {
  type: 'Program';
  body: ASTNode[];
  range: SourceRange;
}

export interface MoveCommand {
  type: 'MoveCommand';
  command: 'FD' | 'FORWARD' | 'BK' | 'BACK';
  distance: Expression;
  range: SourceRange;
}

export interface TurnCommand {
  type: 'TurnCommand';
  command: 'LT' | 'LEFT' | 'RT' | 'RIGHT';
  angle: Expression;
  range: SourceRange;
}

export interface PenCommand {
  type: 'PenCommand';
  command: 'PU' | 'PENUP' | 'PD' | 'PENDOWN';
  range: SourceRange;
}

export interface ColorCommand {
  type: 'ColorCommand';
  command: 'SETPC' | 'SETPENCOLOR';
  color: Expression;
  range: SourceRange;
}

export interface SetXYCommand {
  type: 'SetXYCommand';
  x: Expression;
  y: Expression;
  range: SourceRange;
}

export interface HomeCommand {
  type: 'HomeCommand';
  range: SourceRange;
}

export interface ClearScreenCommand {
  type: 'ClearScreenCommand';
  range: SourceRange;
}

export interface SetHeadingCommand {
  type: 'SetHeadingCommand';
  command: 'SETHEADING' | 'SETH';
  angle: Expression;
  range: SourceRange;
}

export interface PrintCommand {
  type: 'PrintCommand';
  command: 'PRINT' | 'PR';
  value: Expression;
  range: SourceRange;
}

export interface IfStatement {
  type: 'IfStatement';
  condition: Expression;
  body: ASTNode[];
  range: SourceRange;
  bodyRange: SourceRange;
}

export interface IfElseStatement {
  type: 'IfElseStatement';
  condition: Expression;
  thenBody: ASTNode[];
  elseBody: ASTNode[];
  range: SourceRange;
  thenBodyRange: SourceRange;
  elseBodyRange: SourceRange;
}

export interface StopCommand {
  type: 'StopCommand';
  range: SourceRange;
}

export interface RepeatStatement {
  type: 'RepeatStatement';
  count: Expression;
  body: ASTNode[];
  range: SourceRange;
  bodyRange: SourceRange;
}

export interface ProcedureDefinition {
  type: 'ProcedureDefinition';
  name: string;
  params: string[];
  body: ASTNode[];
  range: SourceRange;
  nameRange: SourceRange;
}

export interface ProcedureCall {
  type: 'ProcedureCall';
  name: string;
  args: Expression[];
  range: SourceRange;
  nameRange: SourceRange;
}

export interface Expression {
  type: 'NumberLiteral' | 'WordLiteral' | 'BinaryExpression' | 'ComparisonExpression' | 'ProcedureCallExpr';
  value?: number;
  word?: string;
  operator?: '+' | '-' | '*' | '/' | '>' | '<' | '=';
  left?: Expression;
  right?: Expression;
  procName?: string;
  args?: Expression[];
  range: SourceRange;
}

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface Diagnostic {
  severity: DiagnosticSeverity;
  message: string;
  kidMessage: string;
  range: SourceRange;
  source: string;
  suggestions?: string[];
}

export interface TurtleState {
  x: number;
  y: number;
  heading: number;
  penDown: boolean;
  penColor: string;
  visible: boolean;
}

export type TraceOpType =
  | 'MOVE' | 'PEN_UP' | 'PEN_DOWN' | 'TURN'
  | 'SET_COLOR' | 'SET_XY' | 'HOME' | 'CLEAR' | 'PEN_UP_MOVE';

export interface TraceOp {
  type: TraceOpType;
  from: { x: number; y: number; heading: number };
  to: { x: number; y: number; heading: number };
  penDown: boolean;
  penColor: string;
  lineOpacity?: number;
}

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export interface ExecutionContext {
  procedures: Map<string, ProcedureDefinition>;
  callStack: { name: string; lineIndex: number; body: ASTNode[] }[];
  loopStack: { count: number; current: number; body: ASTNode[]; index: number }[];
  turtle: TurtleState;
  trace: TraceOp[];
  speed: number;
  status: ExecutionStatus;
  error?: string;
}

export interface ProgramInfo {
  procedures: { name: string; params: string[]; line: number }[];
  totalLines: number;
}
