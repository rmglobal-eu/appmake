export interface ChatMessage {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  parentMessageId?: string;
}

export interface Branch {
  branchId: string;
  messages: ChatMessage[];
  createdAt: Date;
  fromMessageId: string;
}

function generateId(): string {
  return `branch_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Creates a new conversation branch from a specific message.
 * All messages up to and including the specified message are copied
 * into a new branch with fresh IDs.
 */
export function createBranch(
  messages: ChatMessage[],
  fromMessageId: string
): { branchId: string; messages: ChatMessage[] } {
  const branchId = generateId();

  // Find the index of the message to branch from
  const messageIndex = messages.findIndex((m) => m.id === fromMessageId);
  if (messageIndex === -1) {
    throw new Error(
      `Message with id "${fromMessageId}" not found in conversation.`
    );
  }

  // Copy all messages up to and including the branch point
  const branchMessages: ChatMessage[] = messages
    .slice(0, messageIndex + 1)
    .map((msg, index) => {
      const newId = `${branchId}_msg_${index}`;
      return {
        ...msg,
        id: newId,
        chatId: branchId,
        createdAt: new Date(msg.createdAt),
        parentMessageId:
          index > 0 ? `${branchId}_msg_${index - 1}` : undefined,
      };
    });

  return {
    branchId,
    messages: branchMessages,
  };
}

/**
 * Merges a branch back into the main conversation.
 * The branch messages are appended after the original branch point
 * in the main conversation, skipping any duplicated messages.
 *
 * Strategy:
 * - Find where the branch diverged (messages that exist in both)
 * - Append only the new messages from the branch
 * - Re-link parentMessageId references
 */
export function mergeBranch(
  mainMessages: ChatMessage[],
  branchMessages: ChatMessage[]
): ChatMessage[] {
  if (branchMessages.length === 0) {
    return [...mainMessages];
  }

  // Find the divergence point by comparing content
  // Branch messages that match main messages (by content + role) are considered shared
  let divergenceIndex = 0;

  for (let i = 0; i < branchMessages.length; i++) {
    const branchMsg = branchMessages[i];
    const mainMatch = mainMessages.find(
      (m, idx) =>
        idx === i &&
        m.content === branchMsg.content &&
        m.role === branchMsg.role
    );

    if (mainMatch) {
      divergenceIndex = i + 1;
    } else {
      break;
    }
  }

  // Get only the new messages from the branch (after divergence)
  const newBranchMessages = branchMessages.slice(divergenceIndex);

  if (newBranchMessages.length === 0) {
    return [...mainMessages];
  }

  // Get the main messages up to the divergence point
  const mainBase = mainMessages.slice(0, divergenceIndex);

  // Re-map the new branch messages to fit into the main conversation
  const mergedNewMessages: ChatMessage[] = newBranchMessages.map(
    (msg, index) => {
      const newId = `merged_${Date.now()}_${index}`;
      const parentId =
        index === 0
          ? mainBase.length > 0
            ? mainBase[mainBase.length - 1].id
            : undefined
          : `merged_${Date.now()}_${index - 1}`;

      return {
        ...msg,
        id: newId,
        chatId: mainBase.length > 0 ? mainBase[0].chatId : msg.chatId,
        parentMessageId: parentId,
        createdAt: new Date(msg.createdAt),
      };
    }
  );

  return [...mainBase, ...mergedNewMessages];
}

/**
 * Gets the message chain (all ancestors) for a given message.
 * Useful for displaying the conversation path in a branched tree.
 */
export function getMessageChain(
  messages: ChatMessage[],
  messageId: string
): ChatMessage[] {
  const chain: ChatMessage[] = [];
  const messageMap = new Map(messages.map((m) => [m.id, m]));

  let current = messageMap.get(messageId);
  while (current) {
    chain.unshift(current);
    current = current.parentMessageId
      ? messageMap.get(current.parentMessageId)
      : undefined;
  }

  return chain;
}

/**
 * Finds all branch points in a conversation.
 * A branch point is a message that has multiple children.
 */
export function findBranchPoints(messages: ChatMessage[]): ChatMessage[] {
  const childrenCount = new Map<string, number>();

  for (const msg of messages) {
    if (msg.parentMessageId) {
      const count = childrenCount.get(msg.parentMessageId) || 0;
      childrenCount.set(msg.parentMessageId, count + 1);
    }
  }

  const messageMap = new Map(messages.map((m) => [m.id, m]));

  return Array.from(childrenCount.entries())
    .filter(([_, count]) => count > 1)
    .map(([id]) => messageMap.get(id)!)
    .filter(Boolean);
}
