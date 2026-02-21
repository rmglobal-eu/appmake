import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_DAILY_LIMIT = 20;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) {
    return Response.json({ used: 0, limit: DEFAULT_DAILY_LIMIT, resetsAt: null });
  }

  const DAILY_LIMIT = (user as Record<string, unknown>).messageLimit as number ?? DEFAULT_DAILY_LIMIT;

  let { dailyMessageCount, messageCountResetAt } = user;
  const now = new Date();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  const msSinceReset = now.getTime() - messageCountResetAt.getTime();

  // If 24h passed, the count is effectively 0
  if (msSinceReset >= twentyFourHours) {
    dailyMessageCount = 0;
    messageCountResetAt = now;
  }

  const resetsAt = new Date(messageCountResetAt.getTime() + twentyFourHours);

  return Response.json({
    used: dailyMessageCount,
    limit: DAILY_LIMIT,
    resetsAt: resetsAt.toISOString(),
  });
}
