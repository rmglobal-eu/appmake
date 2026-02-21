import { getModel } from "./providers";
import { streamText } from "ai";
import type { ModelProvider } from "@/types/chat";

export interface ModelConfig {
  modelId: string;
  provider: ModelProvider;
  weight: number;
}

export interface ModelResult {
  model: string;
  response: string;
  latencyMs: number;
}

export interface MultiModelResult {
  results: ModelResult[];
  merged: string;
}

async function callSingleModel(
  prompt: string,
  config: ModelConfig
): Promise<ModelResult> {
  const start = performance.now();
  const model = getModel(config.modelId, config.provider);

  const { textStream } = streamText({
    model,
    prompt,
  });

  let fullResponse = "";
  for await (const chunk of textStream) {
    fullResponse += chunk;
  }

  const latencyMs = Math.round(performance.now() - start);

  return {
    model: `${config.provider}/${config.modelId}`,
    response: fullResponse,
    latencyMs,
  };
}

function mergeResponses(results: ModelResult[], models: ModelConfig[]): string {
  const configMap = new Map<string, ModelConfig>();
  for (const m of models) {
    configMap.set(`${m.provider}/${m.modelId}`, m);
  }

  const successfulResults = results.filter((r) => r.response.length > 0);

  if (successfulResults.length === 0) {
    return "";
  }

  if (successfulResults.length === 1) {
    return successfulResults[0].response;
  }

  const totalWeight = successfulResults.reduce((sum, r) => {
    const config = configMap.get(r.model);
    return sum + (config?.weight ?? 1);
  }, 0);

  let bestResult = successfulResults[0];
  let bestScore = 0;

  for (const result of successfulResults) {
    const config = configMap.get(result.model);
    const weight = config?.weight ?? 1;
    const normalizedWeight = weight / totalWeight;
    const latencyPenalty = Math.max(0, 1 - result.latencyMs / 30000);
    const lengthBonus = Math.min(1, result.response.length / 500);
    const score = normalizedWeight * 0.6 + latencyPenalty * 0.2 + lengthBonus * 0.2;

    if (score > bestScore) {
      bestScore = score;
      bestResult = result;
    }
  }

  return bestResult.response;
}

export async function callMultiModel(
  prompt: string,
  models: ModelConfig[]
): Promise<MultiModelResult> {
  if (models.length === 0) {
    return { results: [], merged: "" };
  }

  const settled = await Promise.allSettled(
    models.map((config) => callSingleModel(prompt, config))
  );

  const results: ModelResult[] = [];

  for (let i = 0; i < settled.length; i++) {
    const outcome = settled[i];
    if (outcome.status === "fulfilled") {
      results.push(outcome.value);
    } else {
      results.push({
        model: `${models[i].provider}/${models[i].modelId}`,
        response: "",
        latencyMs: 0,
      });
      console.error(
        `Model ${models[i].provider}/${models[i].modelId} failed:`,
        outcome.reason
      );
    }
  }

  const merged = mergeResponses(results, models);

  return { results, merged };
}
