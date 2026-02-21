import type { Intent } from "./intent-classifier";

/**
 * Intent-specific system prompt additions that are prepended to context
 * to help the AI respond more appropriately for the given task type.
 */
const INTENT_TEMPLATES: Record<Intent, string> = {
  "code-gen": `You are in CODE GENERATION mode. Focus on:
- Writing complete, production-ready code
- Proper file structure and organization
- All necessary imports and exports
- TypeScript types for everything
- Error handling and edge cases
- Responsive, accessible UI with Tailwind CSS
- ALWAYS generate ALL files needed — never leave placeholder or TODO comments`,

  debug: `You are in DEBUG mode. Focus on:
- Identifying the ROOT CAUSE of the error, not just symptoms
- Explaining WHY the error occurs
- Providing a minimal, targeted fix
- Use search-replace for small changes instead of rewriting entire files
- If the error is in one file, only modify that file
- Check for common issues: missing imports, typos, wrong types, async/await mistakes
- NEVER add unrelated changes when fixing a bug`,

  explain: `You are in EXPLANATION mode. Focus on:
- Clear, concise explanations with examples
- Break down complex concepts into digestible parts
- Use code snippets to illustrate points
- Relate concepts to what the user has built
- Use analogies when helpful
- DO NOT modify any code unless explicitly asked`,

  refactor: `You are in REFACTORING mode. Focus on:
- Improving code quality without changing behavior
- Better naming, structure, and patterns
- Reducing duplication (DRY principle)
- Improving type safety
- Breaking large components into smaller, focused ones
- Use search-replace for targeted changes
- ALWAYS preserve existing functionality — refactoring must not break anything`,

  design: `You are in DESIGN mode. Focus on:
- Beautiful, modern UI that follows current design trends
- Consistent spacing, typography, and color palette
- Smooth animations and transitions
- Responsive layout that works on all screen sizes
- Dark mode support where appropriate
- Accessibility compliance (contrast, focus states, ARIA)
- Use Tailwind CSS utility classes exclusively`,

  search: `You are in SEARCH/RESEARCH mode. Focus on:
- Using webSearch to find current, accurate information
- Using fetchUrl to read documentation pages in detail
- Providing sources and links for information
- Distinguishing between verified facts and your own knowledge
- When in doubt, search rather than guess`,

  chat: `You are in CONVERSATIONAL mode. Focus on:
- Being helpful, friendly, and concise
- Answering questions directly
- Offering relevant suggestions for what to build next
- Keeping responses short unless detailed explanation is needed`,
};

export function getIntentTemplate(intent: Intent): string {
  return INTENT_TEMPLATES[intent];
}

/**
 * Enhance the system prompt with intent-specific guidance
 */
export function enhancePromptWithIntent(
  basePrompt: string,
  intent: Intent
): string {
  const template = INTENT_TEMPLATES[intent];
  // Insert intent guidance right after the first paragraph
  return `${template}\n\n${basePrompt}`;
}
