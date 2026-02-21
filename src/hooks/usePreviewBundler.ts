"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useEditorStore } from "@/lib/stores/editor-store";
import { usePreviewStore } from "@/lib/stores/preview-store";
import { useChatStore } from "@/lib/stores/chat-store";
import { bundle } from "@/lib/preview/bundler";
import { generateImportMap } from "@/lib/preview/import-map";
import { buildPreviewHtml } from "@/lib/preview/build-preview-html";
import type { BundleError } from "@/lib/preview/bundler";

const DEBOUNCE_MS = 400;
const DEBOUNCE_MS_STREAMING = 1500;

export interface UsePreviewBundlerResult {
  html: string | null;
  status: "idle" | "bundling" | "ready" | "error";
  errors: BundleError[];
  rebuild: () => void;
}

export function usePreviewBundler(): UsePreviewBundlerResult {
  const generatedFiles = useEditorStore((s) => s.generatedFiles);
  const { setStatus, setErrors, setLastBundleTime } = usePreviewStore();

  const [html, setHtml] = useState<string | null>(null);
  const [status, setLocalStatus] = useState<
    "idle" | "bundling" | "ready" | "error"
  >("idle");
  const [errors, setLocalErrors] = useState<BundleError[]>([]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const versionRef = useRef(0);

  const doBuild = useCallback(async () => {
    const files = useEditorStore.getState().generatedFiles;
    const fileCount = Object.keys(files).length;

    if (fileCount === 0) {
      setLocalStatus("idle");
      setStatus("idle");
      setHtml(null);
      return;
    }

    const version = ++versionRef.current;

    setLocalStatus("bundling");
    setStatus("bundling");
    setLocalErrors([]);
    setErrors([]);

    const start = performance.now();

    try {
      const result = await bundle(files);

      // Discard stale results
      if (version !== versionRef.current) return;

      if (!result.success) {
        setLocalStatus("error");
        setStatus("error");
        setLocalErrors(result.errors);
        setErrors(result.errors);
        return;
      }

      const importMap = generateImportMap(result.externals);
      const previewHtml = buildPreviewHtml({
        code: result.code,
        css: result.css,
        importMap,
      });

      // Discard stale results (check again after sync operations)
      if (version !== versionRef.current) return;

      setHtml(previewHtml);
      setLocalStatus("ready");
      setStatus("ready");

      const elapsed = Math.round(performance.now() - start);
      setLastBundleTime(elapsed);
    } catch (err) {
      if (version !== versionRef.current) return;

      const errorMsg =
        err instanceof Error ? err.message : "Unknown bundling error";
      setLocalStatus("error");
      setStatus("error");
      setLocalErrors([{ text: errorMsg }]);
      setErrors([{ text: errorMsg }]);
    }
  }, [setStatus, setErrors, setLastBundleTime]);

  // Watch generatedFiles and debounce rebuilds
  // Use longer debounce while AI is streaming to avoid bundling partial file sets
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const isStreaming = useChatStore.getState().isStreaming;
    const delay = isStreaming ? DEBOUNCE_MS_STREAMING : DEBOUNCE_MS;

    debounceRef.current = setTimeout(() => {
      doBuild();
    }, delay);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [generatedFiles, doBuild]);

  return { html, status, errors, rebuild: doBuild };
}
