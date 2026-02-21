import { db } from "@/lib/db";
import { onboardingProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface OnboardingProgress {
  completedSteps: string[];
  skippedAt?: Date;
  completedAt?: Date;
}

/**
 * Get the onboarding progress for a user.
 * Returns a default empty progress if the user has no record yet.
 */
export async function getProgress(
  userId: string
): Promise<OnboardingProgress> {
  const row = await db.query.onboardingProgress.findFirst({
    where: eq(onboardingProgress.userId, userId),
  });

  if (!row) {
    return { completedSteps: [] };
  }

  let completedSteps: string[] = [];
  if (row.completedSteps) {
    try {
      completedSteps = JSON.parse(row.completedSteps);
    } catch {
      completedSteps = [];
    }
  }

  return {
    completedSteps,
    skippedAt: row.skippedAt ?? undefined,
    completedAt: row.completedAt ?? undefined,
  };
}

/**
 * Mark a specific onboarding step as completed.
 * Creates the progress record if it does not exist.
 */
export async function completeStep(
  userId: string,
  stepId: string
): Promise<void> {
  const existing = await db.query.onboardingProgress.findFirst({
    where: eq(onboardingProgress.userId, userId),
  });

  if (!existing) {
    await db.insert(onboardingProgress).values({
      userId,
      completedSteps: JSON.stringify([stepId]),
    });
    return;
  }

  let steps: string[] = [];
  if (existing.completedSteps) {
    try {
      steps = JSON.parse(existing.completedSteps);
    } catch {
      steps = [];
    }
  }

  if (!steps.includes(stepId)) {
    steps.push(stepId);
  }

  await db
    .update(onboardingProgress)
    .set({ completedSteps: JSON.stringify(steps) })
    .where(eq(onboardingProgress.userId, userId));
}

/**
 * Mark the entire onboarding as skipped.
 */
export async function skipOnboarding(userId: string): Promise<void> {
  const existing = await db.query.onboardingProgress.findFirst({
    where: eq(onboardingProgress.userId, userId),
  });

  const now = new Date();

  if (!existing) {
    await db.insert(onboardingProgress).values({
      userId,
      completedSteps: JSON.stringify([]),
      skippedAt: now,
    });
    return;
  }

  await db
    .update(onboardingProgress)
    .set({ skippedAt: now })
    .where(eq(onboardingProgress.userId, userId));
}

/**
 * Check whether onboarding is fully complete (all steps done, finished, or skipped).
 */
export async function isOnboardingComplete(userId: string): Promise<boolean> {
  const existing = await db.query.onboardingProgress.findFirst({
    where: eq(onboardingProgress.userId, userId),
  });

  if (!existing) return false;

  return !!(existing.completedAt || existing.skippedAt);
}
