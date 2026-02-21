/**
 * Retry Queue for Ghost-Fix System
 *
 * A priority queue with exponential backoff for managing ghost-fix retry
 * attempts. Each error fix task is tracked with its attempts, delay, and
 * priority so the system can retry intelligently.
 */

import { ClassifiedError, ErrorType } from "./error-classifier";

export type RetryStatus =
  | "pending"
  | "in-progress"
  | "waiting"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface RetryTask {
  /** Unique identifier for this task */
  id: string;
  /** The classified error being fixed */
  error: ClassifiedError;
  /** Current status */
  status: RetryStatus;
  /** Number of attempts made */
  attempts: number;
  /** Maximum allowed attempts */
  maxAttempts: number;
  /** Current delay in ms before next retry */
  currentDelay: number;
  /** Priority (higher = more urgent). Auto-calculated from error type. */
  priority: number;
  /** Timestamp of when the task was created */
  createdAt: number;
  /** Timestamp of last attempt */
  lastAttemptAt?: number;
  /** Timestamp when next retry is allowed */
  nextRetryAt?: number;
  /** Result message from last attempt */
  lastResult?: string;
  /** Callback to execute the fix */
  execute: () => Promise<boolean>;
}

interface RetryQueueOptions {
  /** Base delay in ms for exponential backoff. Default: 1000 */
  baseDelay?: number;
  /** Maximum delay cap in ms. Default: 30000 */
  maxDelay?: number;
  /** Backoff multiplier. Default: 2 */
  backoffMultiplier?: number;
  /** Maximum attempts per task. Default: 3 */
  maxAttempts?: number;
  /** Maximum concurrent tasks. Default: 1 */
  concurrency?: number;
  /** Jitter range (0-1) to add randomness to backoff. Default: 0.1 */
  jitter?: number;
}

/** Priority map: higher number = attempted first */
const ERROR_TYPE_PRIORITY: Record<ErrorType, number> = {
  "import-missing": 90,
  syntax: 85,
  "type-error": 75,
  "react-hook-violation": 70,
  runtime: 60,
  style: 40,
  unknown: 20,
};

let taskIdCounter = 0;

function generateTaskId(): string {
  taskIdCounter += 1;
  return `ghost-fix-${Date.now()}-${taskIdCounter}`;
}

export class RetryQueue {
  private tasks: Map<string, RetryTask> = new Map();
  private activeCount = 0;
  private processing = false;
  private options: Required<RetryQueueOptions>;
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  /** Callback fired when any task status changes */
  onStatusChange?: (task: RetryTask) => void;

  /** Callback fired when the queue becomes empty (all done or failed) */
  onQueueDrained?: () => void;

  constructor(options: RetryQueueOptions = {}) {
    this.options = {
      baseDelay: options.baseDelay ?? 1000,
      maxDelay: options.maxDelay ?? 30000,
      backoffMultiplier: options.backoffMultiplier ?? 2,
      maxAttempts: options.maxAttempts ?? 3,
      concurrency: options.concurrency ?? 1,
      jitter: options.jitter ?? 0.1,
    };
  }

  /**
   * Add a new fix task to the queue.
   */
  enqueue(
    error: ClassifiedError,
    execute: () => Promise<boolean>,
    overrides?: Partial<Pick<RetryTask, "maxAttempts" | "priority">>
  ): RetryTask {
    const id = generateTaskId();
    const task: RetryTask = {
      id,
      error,
      status: "pending",
      attempts: 0,
      maxAttempts: overrides?.maxAttempts ?? this.options.maxAttempts,
      currentDelay: this.options.baseDelay,
      priority:
        overrides?.priority ?? ERROR_TYPE_PRIORITY[error.type] ?? 20,
      createdAt: Date.now(),
      execute,
    };

    this.tasks.set(id, task);
    this.notifyChange(task);
    this.processQueue();
    return task;
  }

  /**
   * Cancel a pending or waiting task.
   */
  cancel(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    if (task.status === "pending" || task.status === "waiting") {
      task.status = "cancelled";
      const timer = this.timers.get(taskId);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(taskId);
      }
      this.notifyChange(task);
      return true;
    }
    return false;
  }

  /**
   * Cancel all tasks and clear the queue.
   */
  cancelAll(): void {
    for (const [id, task] of this.tasks) {
      if (task.status === "pending" || task.status === "waiting") {
        task.status = "cancelled";
        this.notifyChange(task);
      }
      const timer = this.timers.get(id);
      if (timer) {
        clearTimeout(timer);
      }
    }
    this.timers.clear();
  }

  /**
   * Retry a specific failed task manually.
   */
  retry(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    if (task.status === "failed" || task.status === "cancelled") {
      task.status = "pending";
      task.attempts = 0;
      task.currentDelay = this.options.baseDelay;
      this.notifyChange(task);
      this.processQueue();
      return true;
    }
    return false;
  }

  /**
   * Get a task by ID.
   */
  getTask(taskId: string): RetryTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks, optionally filtered by status.
   */
  getTasks(status?: RetryStatus): RetryTask[] {
    const all = Array.from(this.tasks.values());
    if (status) return all.filter((t) => t.status === status);
    return all;
  }

  /**
   * Get queue statistics.
   */
  getStats(): {
    total: number;
    pending: number;
    inProgress: number;
    waiting: number;
    succeeded: number;
    failed: number;
    cancelled: number;
  } {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      waiting: tasks.filter((t) => t.status === "waiting").length,
      succeeded: tasks.filter((t) => t.status === "succeeded").length,
      failed: tasks.filter((t) => t.status === "failed").length,
      cancelled: tasks.filter((t) => t.status === "cancelled").length,
    };
  }

  /**
   * Check if the queue has any active or pending work.
   */
  isIdle(): boolean {
    return (
      this.activeCount === 0 &&
      !Array.from(this.tasks.values()).some(
        (t) => t.status === "pending" || t.status === "waiting"
      )
    );
  }

  /**
   * Remove completed (succeeded/failed/cancelled) tasks from the queue.
   */
  prune(): number {
    let pruned = 0;
    for (const [id, task] of this.tasks) {
      if (
        task.status === "succeeded" ||
        task.status === "failed" ||
        task.status === "cancelled"
      ) {
        this.tasks.delete(id);
        pruned++;
      }
    }
    return pruned;
  }

  // -------------------------------------------------------------------------
  // Internal processing
  // -------------------------------------------------------------------------

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.activeCount < this.options.concurrency) {
        const next = this.getNextPendingTask();
        if (!next) break;

        this.activeCount++;
        // Do not await — run concurrently
        this.executeTask(next).finally(() => {
          this.activeCount--;
          this.processQueue();
        });
      }
    } finally {
      this.processing = false;

      if (this.isIdle()) {
        this.onQueueDrained?.();
      }
    }
  }

  private getNextPendingTask(): RetryTask | undefined {
    const pending = Array.from(this.tasks.values())
      .filter((t) => t.status === "pending")
      .sort((a, b) => {
        // Higher priority first
        if (b.priority !== a.priority) return b.priority - a.priority;
        // Older tasks first (FIFO within same priority)
        return a.createdAt - b.createdAt;
      });

    return pending[0];
  }

  private async executeTask(task: RetryTask): Promise<void> {
    task.status = "in-progress";
    task.attempts++;
    task.lastAttemptAt = Date.now();
    this.notifyChange(task);

    try {
      const success = await task.execute();

      if (success) {
        task.status = "succeeded";
        task.lastResult = "Fix applied successfully";
        this.notifyChange(task);
      } else {
        this.handleFailure(task, "Fix did not resolve the error");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      this.handleFailure(task, message);
    }
  }

  private handleFailure(task: RetryTask, reason: string): void {
    task.lastResult = reason;

    if (task.attempts >= task.maxAttempts) {
      task.status = "failed";
      this.notifyChange(task);
      return;
    }

    // Schedule retry with exponential backoff + jitter
    const jitterRange = this.options.jitter * task.currentDelay;
    const jitter = Math.random() * jitterRange * 2 - jitterRange;
    const delay = Math.min(
      task.currentDelay + jitter,
      this.options.maxDelay
    );

    task.status = "waiting";
    task.nextRetryAt = Date.now() + delay;
    task.currentDelay = Math.min(
      task.currentDelay * this.options.backoffMultiplier,
      this.options.maxDelay
    );
    this.notifyChange(task);

    const timer = setTimeout(() => {
      this.timers.delete(task.id);
      if (task.status === "waiting") {
        task.status = "pending";
        this.notifyChange(task);
        this.processQueue();
      }
    }, delay);

    this.timers.set(task.id, timer);
  }

  private notifyChange(task: RetryTask): void {
    this.onStatusChange?.(task);
  }
}

/**
 * Create a pre-configured retry queue for the ghost-fix system.
 */
export function createGhostFixQueue(
  options?: RetryQueueOptions
): RetryQueue {
  return new RetryQueue({
    baseDelay: 1500,
    maxDelay: 20000,
    backoffMultiplier: 2,
    maxAttempts: 3,
    concurrency: 1,
    jitter: 0.15,
    ...options,
  });
}
