/**
 * Creates a WebSocket URL for connecting to a terminal session.
 */
export function getTerminalWsUrl(
  containerId: string,
  sessionId: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
  return `${baseUrl}?type=terminal&container=${containerId}&session=${sessionId}`;
}
