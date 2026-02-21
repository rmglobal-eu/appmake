import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { explainCode } from "@/lib/llm/code-explainer";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code, language, filePath } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'code' field" },
        { status: 400 }
      );
    }

    if (!language || typeof language !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'language' field" },
        { status: 400 }
      );
    }

    const explanation = explainCode(code, language);

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("[API /ai/explain] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
