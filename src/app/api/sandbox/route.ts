import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  createSandbox,
  destroySandbox,
  getSandbox,
} from "@/lib/sandbox/docker-manager";
import type { SandboxTemplate } from "@/types/sandbox";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, template = "node" } = (await req.json()) as {
    projectId: string;
    template?: SandboxTemplate;
  };

  try {
    const sandbox = await createSandbox(projectId, template);
    return NextResponse.json(sandbox);
  } catch (error) {
    console.error("Failed to create sandbox:", error);
    return NextResponse.json(
      { error: "Failed to create sandbox" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId required" },
      { status: 400 }
    );
  }

  const sandbox = await getSandbox(projectId);
  return NextResponse.json(sandbox ?? null);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sandboxId } = (await req.json()) as { sandboxId: string };

  try {
    await destroySandbox(sandboxId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to destroy sandbox:", error);
    return NextResponse.json(
      { error: "Failed to destroy sandbox" },
      { status: 500 }
    );
  }
}
