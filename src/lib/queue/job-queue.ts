/**
 * Simple in-memory job queue for background operations.
 * Supports priority ordering, configurable concurrency, and retries.
 */

import { randomUUID } from "crypto";

export type JobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface Job {
  id: string;
  handler: () => Promise<void>;
  priority: number;
  retries: number;
  createdAt: number;
}

interface InternalJob extends Job {
  status: JobStatus;
  attempts: number;
  error?: string;
  completedAt?: number;
}

export interface JobQueueOptions {
  concurrency: number;
  retries: number;
}

export interface JobQueue {
  add(job: Omit<Job, "id" | "createdAt"> & { id?: string }): string;
  process(): Promise<void>;
  getStatus(jobId: string): JobStatus;
  cancel(jobId: string): void;
  getQueueSize(): number;
  destroy(): void;
}

export function createJobQueue(options: JobQueueOptions): JobQueue {
  const { concurrency, retries: maxRetries } = options;
  const jobs = new Map<string, InternalJob>();
  let activeCount = 0;
  let processing = false;
  let destroyed = false;

  function getPendingJobs(): InternalJob[] {
    const pending: InternalJob[] = [];
    for (const job of jobs.values()) {
      if (job.status === "pending") {
        pending.push(job);
      }
    }
    // Sort by priority descending (higher priority first), then by createdAt ascending
    pending.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.createdAt - b.createdAt;
    });
    return pending;
  }

  async function executeJob(job: InternalJob): Promise<void> {
    job.status = "processing";
    job.attempts++;
    activeCount++;

    try {
      await job.handler();
      job.status = "completed";
      job.completedAt = Date.now();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : String(err);

      if (job.attempts < job.retries + maxRetries) {
        // Retry: put back to pending
        job.status = "pending";
        job.error = errorMessage;
      } else {
        job.status = "failed";
        job.error = errorMessage;
        job.completedAt = Date.now();
      }
    } finally {
      activeCount--;
    }
  }

  return {
    add(
      jobInput: Omit<Job, "id" | "createdAt"> & { id?: string }
    ): string {
      if (destroyed) throw new Error("Queue has been destroyed");

      const id = jobInput.id ?? randomUUID();
      const internalJob: InternalJob = {
        id,
        handler: jobInput.handler,
        priority: jobInput.priority,
        retries: jobInput.retries,
        createdAt: Date.now(),
        status: "pending",
        attempts: 0,
      };
      jobs.set(id, internalJob);
      return id;
    },

    async process(): Promise<void> {
      if (destroyed) throw new Error("Queue has been destroyed");
      if (processing) return;
      processing = true;

      try {
        // Keep processing until all jobs are done
        let hasWork = true;
        while (hasWork) {
          const pending = getPendingJobs();
          if (pending.length === 0 && activeCount === 0) {
            hasWork = false;
            break;
          }

          // Launch jobs up to concurrency limit
          const toRun = pending.slice(0, concurrency - activeCount);

          if (toRun.length > 0) {
            await Promise.all(toRun.map((job) => executeJob(job)));
          } else if (activeCount > 0) {
            // Wait a tick for active jobs to complete
            await new Promise((resolve) => setTimeout(resolve, 10));
          } else {
            hasWork = false;
          }
        }
      } finally {
        processing = false;
      }
    },

    getStatus(jobId: string): JobStatus {
      const job = jobs.get(jobId);
      if (!job) throw new Error(`Job not found: ${jobId}`);
      return job.status;
    },

    cancel(jobId: string): void {
      const job = jobs.get(jobId);
      if (!job) throw new Error(`Job not found: ${jobId}`);
      if (job.status === "pending") {
        job.status = "cancelled";
        job.completedAt = Date.now();
      }
    },

    getQueueSize(): number {
      return jobs.size;
    },

    destroy(): void {
      destroyed = true;
      jobs.clear();
      activeCount = 0;
      processing = false;
    },
  };
}
