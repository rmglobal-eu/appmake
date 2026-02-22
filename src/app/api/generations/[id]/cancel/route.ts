import { auth } from "@/lib/auth/config";
import { cancelGeneration } from "@/lib/generation/generation-manager";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id: generationId } = await params;
  const ok = await cancelGeneration(generationId, session.user.id);

  if (!ok) {
    return Response.json({ ok: false, error: "Not found or not authorized" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
