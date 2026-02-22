const SUMMARY_THRESHOLD = 20;
const KEEP_RECENT = 10;

/**
 * Summarize older messages to stay within token limits.
 * Keeps the first message (initial prompt) and the last N messages intact.
 * Middle messages are compressed into a system-level summary.
 */
export function summarizeConversation(
  messages: Array<{ role: string; content: string }>
): Array<{ role: string; content: string }> {
  if (messages.length <= SUMMARY_THRESHOLD) {
    return messages;
  }

  const firstMessage = messages[0];
  const recentMessages = messages.slice(-KEEP_RECENT);
  const middleMessages = messages.slice(1, -KEEP_RECENT);

  // Build a structured summary of the middle messages
  const summaryParts: string[] = [];
  const designChoices: string[] = [];
  const interviewAnswers: string[] = [];
  const filesModified = new Set<string>();

  for (const msg of middleMessages) {
    const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
    if (msg.role === "user") {
      // Extract the first line / main request
      const firstLine = content.split("\n")[0].slice(0, 200);
      summaryParts.push(`User asked: ${firstLine}`);

      // Detect interview answers
      if (content.includes("Interview answer") || content.includes("q1:") || content.includes("style:")) {
        interviewAnswers.push(firstLine);
      }
    } else if (msg.role === "assistant") {
      // Extract artifact titles and file actions
      const artifactTitles = [...content.matchAll(/title="([^"]+)"/g)].map((m) => m[1]);
      const filePaths = [...content.matchAll(/filePath="([^"]+)"/g)].map((m) => m[1]);

      for (const fp of filePaths) filesModified.add(fp);

      if (artifactTitles.length > 0) {
        summaryParts.push(`AI built: ${artifactTitles.join(", ")} (files: ${filePaths.join(", ")})`);
      } else {
        const firstLine = content.replace(/<[^>]+>/g, "").split("\n").filter(Boolean)[0]?.slice(0, 200);
        if (firstLine) summaryParts.push(`AI responded: ${firstLine}`);
      }

      // Detect design choices
      const colorMentions = content.match(/(?:color|palette|theme|gradient|bg-|text-)\S+/gi);
      if (colorMentions && colorMentions.length > 0) {
        designChoices.push(`Design: used ${colorMentions.slice(0, 5).join(", ")}`);
      }
    }
  }

  // Build structured summary
  const sections: string[] = [
    `[Conversation summary - ${middleMessages.length} messages condensed]`,
    ...summaryParts,
  ];

  if (filesModified.size > 0) {
    sections.push(`Files touched: ${[...filesModified].join(", ")}`);
  }

  if (designChoices.length > 0) {
    sections.push(...designChoices.slice(0, 3));
  }

  if (interviewAnswers.length > 0) {
    sections.push(`User preferences: ${interviewAnswers.join("; ")}`);
  }

  const summaryText = sections.join("\n");

  return [
    firstMessage,
    { role: "user", content: summaryText },
    ...recentMessages,
  ];
}
