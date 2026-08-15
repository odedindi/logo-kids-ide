import { ExecutionContext, Program, TraceOp, TurtleState, ExecutionStatus, ProcedureDefinition } from './types';
import { executeStep } from './executor';

export class LogoScheduler {
  private context: ExecutionContext;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private onUpdate?: (context: ExecutionContext) => void;

  constructor(onUpdate?: (context: ExecutionContext) => void) {
    this.onUpdate = onUpdate;
    this.context = this.createInitialContext();
  }

  private createInitialContext(): ExecutionContext {
    return {
      procedures: new Map(),
      callStack: [],
      loopStack: [],
      turtle: { x: 0, y: 0, heading: 0, penDown: true, penColor: 'black', visible: true },
      trace: [],
      speed: 1,
      status: 'idle'
    };
  }

  public load(program: Program, procedures: Map<string, ProcedureDefinition> = new Map()) {
    this.pause();
    this.context = this.createInitialContext();
    this.context.procedures = procedures;
    this.context.callStack = [{ name: 'main', lineIndex: 0, body: program.body }];
    this.notifyUpdate();
  }

  public reset() {
    this.pause();
    this.context = this.createInitialContext();
    this.notifyUpdate();
  }

  public step() {
    if (this.context.status === 'completed' || this.context.status === 'error') {
      return;
    }
    this.context.status = 'running';
    this.context = executeStep(this.context);
    this.notifyUpdate();
  }

  public run() {
    if (this.context.status === 'completed' || this.context.status === 'error' || this.intervalId) {
      return;
    }
    
    this.context.status = 'running';
    this.intervalId = setInterval(() => {
      this.step();
      if (this.context.status === 'completed' || this.context.status === 'error') {
        this.pause();
      }
    }, 1000 / (this.context.speed * 10)); 
  }

  public pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.context.status === 'running') {
      this.context.status = 'paused';
      this.notifyUpdate();
    }
  }

  public setSpeed(speed: number) {
    this.context.speed = Math.max(0.1, speed);
    if (this.intervalId) {
      this.pause();
      this.run();
    }
  }

  public getTrace(): TraceOp[] {
    return this.context.trace;
  }

  public getTurtleState(): TurtleState {
    return this.context.turtle;
  }

  public getStatus(): ExecutionStatus {
    return this.context.status;
  }

  public getCurrentStep(): number {
    const stack = this.context.callStack;
    return stack.length > 0 ? stack[stack.length - 1].lineIndex : 0;
  }

  private notifyUpdate() {
    if (this.onUpdate) {
      this.onUpdate({ ...this.context });
    }
  }
}
