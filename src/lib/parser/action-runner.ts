import type { Action, ActionState } from "@/types/actions";

export type ActionExecutor = (action: Action) => Promise<{
  output?: string;
  error?: string;
}>;

/**
 * Sequentially executes actions from parsed artifacts.
 * Actions run one at a time in order.
 */
export class ActionRunner {
  private queue: ActionState[] = [];
  private isRunning = false;
  private executor: ActionExecutor;
  private onStateChange: (states: ActionState[]) => void;

  constructor(
    executor: ActionExecutor,
    onStateChange: (states: ActionState[]) => void
  ) {
    this.executor = executor;
    this.onStateChange = onStateChange;
  }

  enqueue(action: Action) {
    this.queue.push({ action, status: "pending" });
    this.onStateChange([...this.queue]);
    this.run();
  }

  private async run() {
    if (this.isRunning) return;
    this.isRunning = true;

    while (true) {
      const next = this.queue.find((a) => a.status === "pending");
      if (!next) break;

      next.status = "running";
      this.onStateChange([...this.queue]);

      try {
        const result = await this.executor(next.action);
        next.status = result.error ? "error" : "completed";
        next.output = result.output;
        next.error = result.error;
      } catch (err) {
        next.status = "error";
        next.error = err instanceof Error ? err.message : String(err);
      }

      this.onStateChange([...this.queue]);
    }

    this.isRunning = false;
  }

  getStates(): ActionState[] {
    return [...this.queue];
  }

  clear() {
    this.queue = [];
    this.onStateChange([]);
  }
}
