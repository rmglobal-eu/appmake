import type { ChatMessage } from "@/types/chat";

const SUMMARY_THRESHOLD = 12;
const KEEP_RECENT = 8;

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

  // Build a simple summary of the middle messages
  const summaryParts: string[] = [];

  for (const msg of middleMessages) {
    const content = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
    if (msg.role === "user") {
      // Extract the first line / main request
      const firstLine = content.split("\n")[0].slice(0, 200);
      summaryParts.push(`User asked: ${firstLine}`);
    } else if (msg.role === "assistant") {
      // Extract artifact titles and file actions
      const artifactTitles = [...content.matchAll(/title="([^"]+)"/g)].map((m) => m[1]);
      const filePaths = [...content.matchAll(/filePath="([^"]+)"/g)].map((m) => m[1]);

      if (artifactTitles.length > 0) {
        summaryParts.push(`AI built: ${artifactTitles.join(", ")} (files: ${filePaths.join(", ")})`);
      } else {
        const firstLine = content.replace(/<[^>]+>/g, "").split("\n").filter(Boolean)[0]?.slice(0, 200);
        if (firstLine) summaryParts.push(`AI responded: ${firstLine}`);
      }
    }
  }

  const summaryText = `[Conversation summary - ${middleMessages.length} messages condensed]\n${summaryParts.join("\n")}`;

  return [
    firstMessage,
    { role: "user", content: summaryText },
    ...recentMessages,
  ];
}
