import { usePreviewErrorStore } from "@/lib/stores/preview-error-store";
import { useEditorStore } from "@/lib/stores/editor-store";
import { MessageParser } from "@/lib/parser/message-parser";
import type { GhostFixStatus } from "@/lib/stores/preview-error-store";

const MAX_ATTEMPTS = 3;
const ERROR_DEBOUNCE_MS = 2000;
const VERIFY_TIMEOUT_MS = 5000;

interface GhostFixAttempt {
  error: string;
  attemptNumber: number;
}

export class GhostFixEngine {
  private status: GhostFixStatus = "idle";
  private attempts: GhostFixAttempt[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private verifyTimer: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null;
  private healthUnsubscribe: (() => void) | null = null;

  dispose() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.verifyTimer) clearTimeout(this.verifyTimer);
    if (this.abortController) this.abortController.abort();
    if (this.healthUnsubscribe) this.healthUnsubscribe();
    this.setStatus("idle");
  }

  handleError() {
    const store = usePreviewErrorStore.getState();
    const files = useEditorStore.getState().generatedFiles;

    // Don't start if no files exist (nothing to fix)
    if (Object.keys(files).length === 0) return;

    // Don't start if already fixing or max attempts reached
    if (this.status === "fixing" || this.status === "verifying") return;
    if (store.ghostFixAttempts >= MAX_ATTEMPTS) {
      this.setStatus("failed");
      return;
    }

    // Debounce — wait for errors to settle
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.startFix();
    }, ERROR_DEBOUNCE_MS);
  }

  handleManualFix() {
    // Reset attempts for manual trigger
    const store = usePreviewErrorStore.getState();
    if (store.errors.length === 0) return;
    this.attempts = [];
    usePreviewErrorStore.getState().resetGhostFixAttempts();
    this.startFix();
  }

  private async startFix() {
    const errorStore = usePreviewErrorStore.getState();
    const editorStore = useEditorStore.getState();

    if (errorStore.errors.length === 0) return;

    const latestError = errorStore.errors[errorStore.errors.length - 1];
    const files = editorStore.generatedFiles;

    if (Object.keys(files).length === 0) return;

    this.setStatus("fixing");
    errorStore.incrementGhostFixAttempts();

    // Abort previous request if any
    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();

    try {
      const response = await fetch("/api/chat/ghost-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: {
            message: latestError.message,
            isBuildError: latestError.isBuildError,
            stack: latestError.stack,
            line: latestError.line,
            col: latestError.col,
          },
          files,
          previousAttempts: this.attempts,
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Ghost fix API returned ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Stream and collect the full response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullContent += decoder.decode(value, { stream: true });
      }

      // Parse response to extract file actions
      const fixedFiles: Record<string, string> = {};
      const parser = new MessageParser({
        onActionClose: (_artifactId, action) => {
          if (action.type === "file" && action.filePath && action.content) {
            fixedFiles[action.filePath] = action.content;
          }
        },
      });

      parser.push(fullContent);
      parser.end();

      if (Object.keys(fixedFiles).length === 0) {
        throw new Error("Ghost fix returned no file changes");
      }

      // Apply fixes — this triggers a preview rebuild
      useEditorStore.getState().addGeneratedFiles(fixedFiles);

      // Clear current errors and wait for preview-ready signal
      usePreviewErrorStore.getState().clearErrors();
      this.setStatus("verifying");

      // Listen for preview health
      this.waitForVerification(latestError.message);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;

      this.attempts.push({
        error: latestError.message,
        attemptNumber: this.attempts.length + 1,
      });

      const store = usePreviewErrorStore.getState();
      if (store.ghostFixAttempts >= MAX_ATTEMPTS) {
        this.setStatus("failed");
      } else {
        this.setStatus("idle");
      }
    }
  }

  private waitForVerification(originalError: string) {
    // Listen for preview-ready (previewHealthy) AND check for new errors
    this.healthUnsubscribe?.();

    this.healthUnsubscribe = usePreviewErrorStore.subscribe((state, prev) => {
      if (this.status !== "verifying") return;

      // New errors appeared — fix failed
      if (state.errors.length > prev.errors.length) {
        this.onFixFailed(originalError);
        return;
      }

      // Preview loaded successfully and no errors — fix worked
      if (state.previewHealthy && state.errors.length === 0) {
        this.onFixSuccess();
      }
    });

    // Timeout: if no clear signal, check final state
    this.verifyTimer = setTimeout(() => {
      if (this.status !== "verifying") return;

      const store = usePreviewErrorStore.getState();
      if (store.previewHealthy && store.errors.length === 0) {
        this.onFixSuccess();
      } else {
        this.onFixFailed(originalError);
      }
    }, VERIFY_TIMEOUT_MS);
  }

  private onFixSuccess() {
    this.cleanupVerification();
    this.attempts = [];
    this.setStatus("success");

    // Reset to idle after a short delay
    setTimeout(() => {
      if (this.status === "success") {
        this.setStatus("idle");
      }
    }, 3000);
  }

  private onFixFailed(originalError: string) {
    this.cleanupVerification();

    this.attempts.push({
      error: originalError,
      attemptNumber: this.attempts.length + 1,
    });

    const store = usePreviewErrorStore.getState();
    if (store.ghostFixAttempts >= MAX_ATTEMPTS) {
      this.setStatus("failed");
    } else {
      // Auto-retry
      this.setStatus("idle");
      this.handleError();
    }
  }

  private cleanupVerification() {
    if (this.healthUnsubscribe) {
      this.healthUnsubscribe();
      this.healthUnsubscribe = null;
    }
    if (this.verifyTimer) {
      clearTimeout(this.verifyTimer);
      this.verifyTimer = null;
    }
  }

  private setStatus(status: GhostFixStatus) {
    this.status = status;
    usePreviewErrorStore.getState().setGhostFixStatus(status);
  }
}
