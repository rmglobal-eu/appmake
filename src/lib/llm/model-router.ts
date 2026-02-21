import type { Intent, Complexity } from "./intent-classifier";
import type { ModelProvider } from "@/types/chat";

export interface ModelSelection {
  modelId: string;
  provider: ModelProvider;
  temperature: number;
  maxTokens: number;
}

type PlanTier = "free" | "pro" | "team";

interface RouteConfig {
  modelId: string;
  provider: ModelProvider;
  temperature: number;
  maxTokens: number;
}

// Model routing table based on intent + complexity + plan
const ROUTE_TABLE: Record<PlanTier, Record<Intent, Record<Complexity, RouteConfig>>> = {
  free: {
    "code-gen": {
      low: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.2, maxTokens: 8192 },
      medium: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.3, maxTokens: 12288 },
      high: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.3, maxTokens: 16384 },
    },
    debug: {
      low: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.1, maxTokens: 4096 },
      medium: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.2, maxTokens: 8192 },
      high: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.2, maxTokens: 12288 },
    },
    explain: {
      low: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.5, maxTokens: 4096 },
      medium: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.5, maxTokens: 8192 },
      high: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.5, maxTokens: 12288 },
    },
    refactor: {
      low: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.2, maxTokens: 8192 },
      medium: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.2, maxTokens: 12288 },
      high: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.2, maxTokens: 16384 },
    },
    design: {
      low: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.4, maxTokens: 8192 },
      medium: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.4, maxTokens: 12288 },
      high: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.4, maxTokens: 16384 },
    },
    search: {
      low: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.3, maxTokens: 4096 },
      medium: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.3, maxTokens: 8192 },
      high: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.3, maxTokens: 8192 },
    },
    chat: {
      low: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.7, maxTokens: 2048 },
      medium: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.7, maxTokens: 4096 },
      high: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.7, maxTokens: 4096 },
    },
  },
  pro: {
    "code-gen": {
      low: { modelId: "claude-sonnet-4-20250514", provider: "anthropic", temperature: 0.2, maxTokens: 8192 },
      medium: { modelId: "claude-sonnet-4-20250514", provider: "anthropic", temperature: 0.3, maxTokens: 16384 },
      high: { modelId: "claude-sonnet-4-20250514", provider: "anthropic", temperature: 0.3, maxTokens: 16384 },
    },
    debug: {
      low: { modelId: "gpt-4.1", provider: "openai", temperature: 0.1, maxTokens: 8192 },
      medium: { modelId: "claude-sonnet-4-20250514", provider: "anthropic", temperature: 0.2, maxTokens: 12288 },
      high: { modelId: "claude-sonnet-4-20250514", provider: "anthropic", temperature: 0.2, maxTokens: 16384 },
    },
    explain: {
      low: { modelId: "gpt-4.1", provider: "openai", temperature: 0.5, maxTokens: 4096 },
      medium: { modelId: "gpt-4.1", provider: "openai", temperature: 0.5, maxTokens: 8192 },
      high: { modelId: "claude-sonnet-4-20250514", provider: "anthropic", temperature: 0.5, maxTokens: 12288 },
    },
    refactor: {
      low: { modelId: "gpt-4.1", provider: "openai", temperature: 0.2, maxTokens: 8192 },
      medium: { modelId: "claude-sonnet-4-20250514", provider: "anthropic", temperature: 0.2, maxTokens: 16384 },
      high: { modelId: "claude-sonnet-4-20250514", provider: "anthropic", temperature: 0.2, maxTokens: 16384 },
    },
    design: {
      low: { modelId: "gpt-4.1", provider: "openai", temperature: 0.4, maxTokens: 8192 },
      medium: { modelId: "claude-sonnet-4-20250514", provider: "anthropic", temperature: 0.4, maxTokens: 16384 },
      high: { modelId: "claude-sonnet-4-20250514", provider: "anthropic", temperature: 0.4, maxTokens: 16384 },
    },
    search: {
      low: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.3, maxTokens: 4096 },
      medium: { modelId: "gpt-4.1", provider: "openai", temperature: 0.3, maxTokens: 8192 },
      high: { modelId: "gpt-4.1", provider: "openai", temperature: 0.3, maxTokens: 8192 },
    },
    chat: {
      low: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.7, maxTokens: 2048 },
      medium: { modelId: "gpt-4.1", provider: "openai", temperature: 0.7, maxTokens: 4096 },
      high: { modelId: "gpt-4.1", provider: "openai", temperature: 0.7, maxTokens: 4096 },
    },
  },
  team: {
    "code-gen": {
      low: { modelId: "claude-sonnet-4-20250514", provider: "anthropic", temperature: 0.2, maxTokens: 12288 },
      medium: { modelId: "claude-opus-4-20250514", provider: "anthropic", temperature: 0.3, maxTokens: 16384 },
      high: { modelId: "claude-opus-4-20250514", provider: "anthropic", temperature: 0.3, maxTokens: 16384 },
    },
    debug: {
      low: { modelId: "claude-sonnet-4-20250514", provider: "anthropic", temperature: 0.1, maxTokens: 8192 },
      medium: { modelId: "claude-opus-4-20250514", provider: "anthropic", temperature: 0.2, maxTokens: 16384 },
      high: { modelId: "claude-opus-4-20250514", provider: "anthropic", temperature: 0.2, maxTokens: 16384 },
    },
    explain: {
      low: { modelId: "gpt-4.1", provider: "openai", temperature: 0.5, maxTokens: 8192 },
      medium: { modelId: "claude-sonnet-4-20250514", provider: "anthropic", temperature: 0.5, maxTokens: 12288 },
      high: { modelId: "claude-opus-4-20250514", provider: "anthropic", temperature: 0.5, maxTokens: 16384 },
    },
    refactor: {
      low: { modelId: "claude-sonnet-4-20250514", provider: "anthropic", temperature: 0.2, maxTokens: 12288 },
      medium: { modelId: "claude-opus-4-20250514", provider: "anthropic", temperature: 0.2, maxTokens: 16384 },
      high: { modelId: "claude-opus-4-20250514", provider: "anthropic", temperature: 0.2, maxTokens: 16384 },
    },
    design: {
      low: { modelId: "claude-sonnet-4-20250514", provider: "anthropic", temperature: 0.4, maxTokens: 12288 },
      medium: { modelId: "claude-opus-4-20250514", provider: "anthropic", temperature: 0.4, maxTokens: 16384 },
      high: { modelId: "claude-opus-4-20250514", provider: "anthropic", temperature: 0.4, maxTokens: 16384 },
    },
    search: {
      low: { modelId: "gpt-4.1", provider: "openai", temperature: 0.3, maxTokens: 4096 },
      medium: { modelId: "gpt-4.1", provider: "openai", temperature: 0.3, maxTokens: 8192 },
      high: { modelId: "claude-sonnet-4-20250514", provider: "anthropic", temperature: 0.3, maxTokens: 12288 },
    },
    chat: {
      low: { modelId: "gpt-4.1-mini", provider: "openai", temperature: 0.7, maxTokens: 2048 },
      medium: { modelId: "gpt-4.1", provider: "openai", temperature: 0.7, maxTokens: 4096 },
      high: { modelId: "claude-sonnet-4-20250514", provider: "anthropic", temperature: 0.7, maxTokens: 8192 },
    },
  },
};

/**
 * Select the best model based on intent, complexity, and user plan.
 * If the user has explicitly selected a model, that takes precedence.
 */
export function selectModel(
  intent: Intent,
  complexity: Complexity,
  userPlan: PlanTier = "free",
  userSelectedModel?: { modelId: string; provider: ModelProvider } | null
): ModelSelection {
  // User's explicit choice takes priority
  if (userSelectedModel) {
    const route = ROUTE_TABLE[userPlan][intent][complexity];
    return {
      modelId: userSelectedModel.modelId,
      provider: userSelectedModel.provider,
      temperature: route.temperature,
      maxTokens: route.maxTokens,
    };
  }

  const route = ROUTE_TABLE[userPlan][intent][complexity];
  return {
    modelId: route.modelId,
    provider: route.provider,
    temperature: route.temperature,
    maxTokens: route.maxTokens,
  };
}
