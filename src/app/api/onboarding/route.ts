import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { onboardingProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  getProgress,
  completeStep,
  skipOnboarding,
} from "@/lib/onboarding/progress-tracker";

/**
 * GET /api/onboarding
 * Returns the authenticated user's onboarding progress.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progress = await getProgress(session.user.id);
  return NextResponse.json(progress);
}

/**
 * PUT /api/onboarding
 * Update onboarding progress for the authenticated user.
 *
 * Body: { action: "complete_step" | "skip" | "finish"; stepId?: string }
 */
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    action: "complete_step" | "skip" | "finish";
    stepId?: string;
  };

  const { action, stepId } = body;

  switch (action) {
    case "complete_step": {
      if (!stepId) {
        return NextResponse.json(
          { error: "stepId is required for complete_step action" },
          { status: 400 }
        );
      }
      await completeStep(session.user.id, stepId);
      break;
    }

    case "skip": {
      await skipOnboarding(session.user.id);
      break;
    }

    case "finish": {
      // Mark onboarding as fully completed
      const existing = await db.query.onboardingProgress.findFirst({
        where: eq(onboardingProgress.userId, session.user.id),
      });

      const now = new Date();

      if (!existing) {
        await db.insert(onboardingProgress).values({
          userId: session.user.id,
          completedSteps: JSON.stringify([]),
          completedAt: now,
        });
      } else {
        await db
          .update(onboardingProgress)
          .set({ completedAt: now })
          .where(eq(onboardingProgress.userId, session.user.id));
      }
      break;
    }

    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const progress = await getProgress(session.user.id);
  return NextResponse.json(progress);
}
