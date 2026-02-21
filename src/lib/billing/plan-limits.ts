export interface PlanLimits {
  messagesPerDay: number;
  projects: number;
  storageBytes: number;
  models: string[];
  maxFileSize: number;
  collaborators: number;
  customDomain: boolean;
  prioritySupport: boolean;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    messagesPerDay: 20,
    projects: 3,
    storageBytes: 1 * 1024 * 1024 * 1024, // 1 GB
    models: ["gpt-3.5-turbo", "claude-3-haiku"],
    maxFileSize: 5 * 1024 * 1024, // 5 MB
    collaborators: 1,
    customDomain: false,
    prioritySupport: false,
  },
  pro: {
    messagesPerDay: 200,
    projects: 50,
    storageBytes: 10 * 1024 * 1024 * 1024, // 10 GB
    models: [
      "gpt-3.5-turbo",
      "gpt-4",
      "gpt-4-turbo",
      "claude-3-haiku",
      "claude-3-sonnet",
      "claude-3-opus",
    ],
    maxFileSize: 50 * 1024 * 1024, // 50 MB
    collaborators: 1,
    customDomain: false,
    prioritySupport: true,
  },
  team: {
    messagesPerDay: 1000,
    projects: -1, // -1 = unlimited
    storageBytes: 100 * 1024 * 1024 * 1024, // 100 GB
    models: [
      "gpt-3.5-turbo",
      "gpt-4",
      "gpt-4-turbo",
      "gpt-4o",
      "claude-3-haiku",
      "claude-3-sonnet",
      "claude-3-opus",
      "claude-3.5-sonnet",
    ],
    maxFileSize: 500 * 1024 * 1024, // 500 MB
    collaborators: 25,
    customDomain: true,
    prioritySupport: true,
  },
};

/**
 * Returns the plan limits for a given plan name.
 * Falls back to free plan if plan is not recognized.
 */
export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

/**
 * Checks if a project count is within the plan limit.
 * Returns true if unlimited (-1) or within limit.
 */
export function isWithinProjectLimit(
  plan: string,
  currentCount: number
): boolean {
  const limits = getPlanLimits(plan);
  if (limits.projects === -1) return true;
  return currentCount < limits.projects;
}

/**
 * Checks if a model is available for the given plan.
 */
export function isModelAvailable(plan: string, modelId: string): boolean {
  const limits = getPlanLimits(plan);
  return limits.models.includes(modelId);
}

/**
 * Formats storage bytes to human-readable string.
 */
export function formatStorage(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(0)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
}
