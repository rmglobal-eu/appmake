import { streamText, stepCountIs, type ModelMessage } from "ai";
import { getModel } from "./providers";
import { getSystemPrompt } from "./system-prompt";
import { allTools } from "./tools";
import type { ModelProvider } from "@/types/chat";
import type { DesignScheme } from "@/types/design-scheme";

interface StreamChatOptions {
  messages: ModelMessage[];
  modelId: string;
  provider: ModelProvider;
  projectContext?: string;
  abortSignal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
  designScheme?: DesignScheme | null;
}

export function streamChat({
  messages,
  modelId,
  provider,
  projectContext,
  abortSignal,
  temperature,
  maxTokens,
  designScheme,
}: StreamChatOptions) {
  const model = getModel(modelId, provider);
  const systemPrompt = getSystemPrompt(projectContext, designScheme);

  return streamText({
    model,
    system: systemPrompt,
    messages,
    tools: allTools,
    stopWhen: stepCountIs(10),
    maxOutputTokens: maxTokens ?? 16384,
    temperature: temperature ?? 0.3,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.05,
    abortSignal,
  });
}
