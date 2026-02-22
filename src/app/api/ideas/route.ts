import { NextResponse } from "next/server";
import { generateText } from "ai";
import { auth } from "@/lib/auth/config";
import { getModel } from "@/lib/llm/providers";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { text } = await generateText({
      model: getModel("gpt-4.1-mini", "openai"),
      system: `You generate creative web app ideas for developers. Return ONLY a JSON array of exactly 6 ideas. Each idea must have:
- emoji: a single relevant emoji
- title: short title (2-4 words)
- description: one-line description (max 15 words)
- prompt: a detailed build prompt (2-3 sentences) that a developer would use to build the app

Vary the ideas across categories: SaaS, productivity, social, e-commerce, education, health, finance, entertainment, etc.
Return ONLY the JSON array, no markdown fences or extra text.`,
      prompt: "Generate 6 unique, creative, and modern web app ideas.",
    });

    const ideas = JSON.parse(text);
    return NextResponse.json({ ideas });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate ideas" },
      { status: 500 }
    );
  }
}
