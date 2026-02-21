import { streamText } from "ai";
import { getModel } from "@/lib/llm/providers";
import { getGhostFixSystemPrompt } from "@/lib/llm/system-prompt";
import { auth } from "@/lib/auth/config";

interface GhostFixRequest {
  error: {
    message: string;
    isBuildError?: boolean;
    stack?: string;
    line?: number;
    col?: number;
  };
  files: Record<string, string>;
  previousAttempts: Array<{ error: string; attemptNumber: number }>;
  buildPipelineContext?: string;
  modelId?: string;
  provider?: "openai" | "anthropic";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json()) as GhostFixRequest;
  const {
    error,
    files,
    previousAttempts,
    buildPipelineContext,
    modelId = "gpt-4.1-mini",
    provider = "openai",
  } = body;

  const model = getModel(modelId, provider);
  const systemPrompt = getGhostFixSystemPrompt(buildPipelineContext);

  // Build the user message with all context
  const fileList = Object.entries(files)
    .map(([path, content]) => `--- ${path} ---\n${content}`)
    .join("\n\n");

  const errorType = error.isBuildError ? "Build error" : "Runtime error";
  const errorDetail = [
    `Type: ${errorType}`,
    `Message: ${error.message}`,
    error.line ? `Line: ${error.line}` : null,
    error.col ? `Column: ${error.col}` : null,
    error.stack ? `Stack (truncated):\n${error.stack}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const previousAttemptsText =
    previousAttempts.length > 0
      ? `\n\nPrevious fix attempts that FAILED (do NOT repeat these):\n${previousAttempts
          .map((a) => `Attempt ${a.attemptNumber}: ${a.error}`)
          .join("\n")}`
      : "";

  const userMessage = `Fix this preview error.

ERROR:
${errorDetail}
${previousAttemptsText}

FILES:
${fileList}`;

  const result = streamText({
    model,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    maxOutputTokens: 8192,
    abortSignal: req.signal,
  });

  // Stream raw text back (no DB save, no tool handling)
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const part of result.fullStream) {
          if (part.type === "text-delta") {
            controller.enqueue(encoder.encode(part.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
