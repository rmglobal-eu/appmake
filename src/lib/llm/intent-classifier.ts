export type Intent =
  | "code-gen"
  | "debug"
  | "explain"
  | "refactor"
  | "design"
  | "chat"
  | "search";

export type Complexity = "low" | "medium" | "high";

export interface ClassifiedIntent {
  intent: Intent;
  complexity: Complexity;
  estimatedTokens: number;
  confidence: number;
}

const INTENT_PATTERNS: Record<Intent, RegExp[]> = {
  "code-gen": [
    /\b(build|create|make|add|implement|write|generate|code|develop|setup|scaffold)\b/i,
    /\b(new feature|new component|new page|new file|app|website|landing page)\b/i,
    /\b(form|button|modal|table|chart|dashboard|layout|navbar|sidebar|footer)\b/i,
  ],
  debug: [
    /\b(fix|debug|error|bug|broken|not working|crash|issue|problem|wrong|fail)\b/i,
    /\b(why does|doesn't work|undefined|null|NaN|500|404|TypeError|SyntaxError)\b/i,
  ],
  explain: [
    /\b(explain|what does|how does|what is|why is|tell me about|understand|describe)\b/i,
    /\b(how it works|what's happening|walk me through)\b/i,
  ],
  refactor: [
    /\b(refactor|clean up|improve|optimize|simplify|reorganize|restructure|rename)\b/i,
    /\b(make it better|performance|faster|cleaner|more readable)\b/i,
  ],
  design: [
    /\b(design|style|color|theme|dark mode|responsive|mobile|animation|ui|ux)\b/i,
    /\b(look like|match this|screenshot|figma|beautiful|modern|gradient|font)\b/i,
  ],
  search: [
    /\b(search|find|look up|google|documentation|docs|latest|current version)\b/i,
    /\b(npm package|library|api reference|how to use)\b/i,
  ],
  chat: [
    /\b(hello|hi|hey|thanks|thank you|good morning|good night|bye)\b/i,
    /\b(who are you|what can you|help me)\b/i,
  ],
};

const COMPLEXITY_SIGNALS = {
  high: [
    /\b(full app|complete|entire|whole|multi-page|authentication|payment|stripe|database)\b/i,
    /\b(dashboard|admin panel|e-commerce|saas|real-time|websocket|collaboration)\b/i,
    /\b(deploy|production|api integration|backend|server)\b/i,
  ],
  medium: [
    /\b(component|form|table|chart|modal|page|section|feature|function)\b/i,
    /\b(with|including|also|and then|after that)\b/i,
  ],
};

function estimateTokens(message: string, complexity: Complexity): number {
  const baseTokens = Math.ceil(message.length / 4);
  const multipliers: Record<Complexity, number> = {
    low: 500,
    medium: 2000,
    high: 6000,
  };
  return Math.max(baseTokens, multipliers[complexity]);
}

export function classifyIntent(message: string): ClassifiedIntent {
  const scores: Record<Intent, number> = {
    "code-gen": 0,
    debug: 0,
    explain: 0,
    refactor: 0,
    design: 0,
    search: 0,
    chat: 0,
  };

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS) as [Intent, RegExp[]][]) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        scores[intent] += 1;
      }
    }
  }

  // Default to code-gen if no patterns matched
  const entries = Object.entries(scores) as [Intent, number][];
  const maxScore = Math.max(...entries.map(([, s]) => s));

  let intent: Intent;
  let confidence: number;

  if (maxScore === 0) {
    intent = "code-gen";
    confidence = 0.3;
  } else {
    intent = entries.find(([, s]) => s === maxScore)![0];
    const totalScore = entries.reduce((acc, [, s]) => acc + s, 0);
    confidence = totalScore > 0 ? maxScore / totalScore : 0.5;
  }

  // Determine complexity
  let complexity: Complexity = "low";
  if (COMPLEXITY_SIGNALS.high.some((p) => p.test(message))) {
    complexity = "high";
  } else if (COMPLEXITY_SIGNALS.medium.some((p) => p.test(message))) {
    complexity = "medium";
  }

  // Message length also affects complexity
  if (message.length > 500) complexity = "high";
  else if (message.length > 200 && complexity === "low") complexity = "medium";

  return {
    intent,
    complexity,
    estimatedTokens: estimateTokens(message, complexity),
    confidence,
  };
}
