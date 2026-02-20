// Re-export for convenience. The actual server runs as a standalone process.
// See server/ws.ts for the implementation.
export const WS_PORT = parseInt(process.env.WS_PORT || "3001", 10);
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || `ws://localhost:${WS_PORT}`;
