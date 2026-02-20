/**
 * Client-side file sync via WebSocket.
 * Sends file changes to the sandbox and receives updates.
 */
export class FileSyncClient {
  private ws: WebSocket | null = null;
  private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private onFilesChanged?: (files: string) => void;

  connect(containerId: string, onFilesChanged?: (files: string) => void) {
    this.onFilesChanged = onFilesChanged;
    const baseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    this.ws = new WebSocket(
      `${baseUrl}?type=sync&container=${containerId}`
    );

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "files" && this.onFilesChanged) {
          this.onFilesChanged(msg.data);
        }
      } catch {
        // Ignore parse errors
      }
    };
  }

  writeFile(path: string, content: string) {
    // Debounce writes — 300ms
    const existing = this.debounceTimers.get(path);
    if (existing) clearTimeout(existing);

    this.debounceTimers.set(
      path,
      setTimeout(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: "write", path, content }));
        }
        this.debounceTimers.delete(path);
      }, 300)
    );
  }

  requestFileList(path = "/workspace") {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "list", path }));
    }
  }

  disconnect() {
    this.debounceTimers.forEach(clearTimeout);
    this.debounceTimers.clear();
    this.ws?.close();
    this.ws = null;
  }
}
