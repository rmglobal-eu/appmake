import { streamText, stepCountIs, type ModelMessage } from "ai";
import { getModel } from "./providers";
import { getSystemPrompt } from "./system-prompt";
import { allTools } from "./tools";
import type { ModelProvider } from "@/types/chat";
import type { Intent } from "./intent-classifier";
import { getIntentTemplate } from "./prompt-templates";

interface StreamChatOptions {
  messages: ModelMessage[];
  modelId: string;
  provider: ModelProvider;
  projectContext?: string;
  planMode?: boolean;
  abortSignal?: AbortSignal;
  intent?: Intent;
  temperature?: number;
  maxTokens?: number;
}

export function streamChat({
  messages,
  modelId,
  provider,
  projectContext,
  planMode,
  abortSignal,
  intent,
  temperature,
  maxTokens,
}: StreamChatOptions) {
  const model = getModel(modelId, provider);
  let systemPrompt = getSystemPrompt(projectContext, planMode);

  // Prepend intent-specific guidance if available
  if (intent) {
    const intentTemplate = getIntentTemplate(intent);
    systemPrompt = `${intentTemplate}\n\n${systemPrompt}`;
  }

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
