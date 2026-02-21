import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  writeFile,
  readFile,
  listFiles,
} from "@/lib/sandbox/docker-files";
import { touchSandbox } from "@/lib/sandbox/docker-manager";
import { verifySandboxOwnership } from "@/lib/auth/ownership";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sandboxId, containerId, filePath, content } = (await req.json()) as {
    sandboxId: string;
    containerId: string;
    filePath: string;
    content: string;
  };

  const owns = await verifySandboxOwnership(sandboxId, session.user.id);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await writeFile(containerId, filePath, content);
    await touchSandbox(sandboxId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to write file:", error);
    return NextResponse.json(
      { error: "Failed to write file" },
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
  const sandboxId = searchParams.get("sandboxId");
  const containerId = searchParams.get("containerId");
  const filePath = searchParams.get("filePath");
  const listDir = searchParams.get("list");

  if (!containerId) {
    return NextResponse.json(
      { error: "containerId required" },
      { status: 400 }
    );
  }

  if (sandboxId) {
    const owns = await verifySandboxOwnership(sandboxId, session.user.id);
    if (!owns) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    if (listDir) {
      const tree = await listFiles(containerId, listDir || "/workspace");
      return NextResponse.json(tree);
    }

    if (!filePath) {
      return NextResponse.json(
        { error: "filePath or list required" },
        { status: 400 }
      );
    }

    const content = await readFile(containerId, filePath);
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Failed to read file:", error);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
}
