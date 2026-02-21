import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { exec } from "@/lib/sandbox/docker-exec";
import { touchSandbox } from "@/lib/sandbox/docker-manager";
import { verifySandboxOwnership } from "@/lib/auth/ownership";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sandboxId, containerId, command } = (await req.json()) as {
    sandboxId: string;
    containerId: string;
    command: string;
  };

  if (!containerId || !command) {
    return NextResponse.json(
      { error: "containerId and command required" },
      { status: 400 }
    );
  }

  const owns = await verifySandboxOwnership(sandboxId, session.user.id);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await exec(containerId, command);
    await touchSandbox(sandboxId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to execute command:", error);
    return NextResponse.json(
      { error: "Failed to execute command" },
      { status: 500 }
    );
  }
}
