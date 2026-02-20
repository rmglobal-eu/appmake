import { streamText, stepCountIs, type ModelMessage } from "ai";
import { getModel } from "./providers";
import { getSystemPrompt } from "./system-prompt";
import { allTools } from "./tools";
import type { ModelProvider } from "@/types/chat";

interface StreamChatOptions {
  messages: ModelMessage[];
  modelId: string;
  provider: ModelProvider;
  projectContext?: string;
  planMode?: boolean;
  abortSignal?: AbortSignal;
}

export function streamChat({
  messages,
  modelId,
  provider,
  projectContext,
  planMode,
  abortSignal,
}: StreamChatOptions) {
  const model = getModel(modelId, provider);
  const systemPrompt = getSystemPrompt(projectContext, planMode);

  return streamText({
    model,
    system: systemPrompt,
    messages,
    tools: allTools,
    stopWhen: stepCountIs(10),
    maxOutputTokens: 16384,
    abortSignal,
  });
}
