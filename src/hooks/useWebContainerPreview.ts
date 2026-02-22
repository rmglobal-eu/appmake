"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@/lib/stores/editor-store";
import { usePreviewStore } from "@/lib/stores/preview-store";
import { useChatStore } from "@/lib/stores/chat-store";
import {
  getWebContainer,
  isSupported,
  mountProject,
  writeFile,
  runInstall,
  startDevServer,
  stopDevServer,
  teardown,
} from "@/lib/preview/webcontainer";
import { buildFileSystemTree } from "@/lib/preview/file-tree-builder";
import { scaffoldProject } from "@/lib/preview/default-project";

const DEBOUNCE_FIRST_MOUNT = 500;
const DEBOUNCE_STREAMING = 2000;
const DEBOUNCE_HMR = 300;
const DEBOUNCE_PKG_JSON = 3000;

interface WebContainerPreviewState {
  /** Whether the dev server is currently running */
  serverRunning: boolean;
  /** Whether WebContainers are supported (false = use esbuild fallback) */
  supported: boolean;
}

export function useWebContainerPreview(): WebContainerPreviewState {
  const generatedFiles = useEditorStore((s) => s.generatedFiles);
  const {
    setStatus,
    setErrors,
    setPreviewUrl,
    setProgressMessage,
    appendInstallOutput,
    clearInstallOutput,
    resetPreview,
    clearConsole,
  } = usePreviewStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hmrDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pkgDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track state across renders
  const serverRunningRef = useRef(false);
  const mountedFilesRef = useRef<Record<string, string>>({});
  const isBootingRef = useRef(false);
  const supportedRef = useRef(isSupported());

  /**
   * Full lifecycle: boot → mount → install → start dev server
   */
  const fullBuild = useCallback(
    async (files: Record<string, string>) => {
      if (isBootingRef.current) return;
      if (Object.keys(files).length === 0) return;

      isBootingRef.current = true;

      try {
        // 1. Boot WebContainer
        setStatus("booting");
        setProgressMessage("Starting environment...");
        clearConsole();
        clearInstallOutput();

        await getWebContainer();

        // 2. Scaffold + mount
        setStatus("mounting");
        setProgressMessage("Preparing files...");

        const scaffolded = scaffoldProject(files);
        const tree = buildFileSystemTree(scaffolded);
        await mountProject(tree);

        mountedFilesRef.current = { ...scaffolded };

        // 3. npm install
        setStatus("installing");
        setProgressMessage("Installing packages...");

        const exitCode = await runInstall((line) => {
          appendInstallOutput(line);
        });

        if (exitCode !== 0) {
          setStatus("error");
          setErrors([{ text: `npm install failed with exit code ${exitCode}` }]);
          setProgressMessage(null);
          isBootingRef.current = false;
          return;
        }

        // 4. Start dev server
        setStatus("starting");
        setProgressMessage("Starting dev server...");

        await startDevServer(
          (line) => {
            appendInstallOutput(line);
          },
          (_port, url) => {
            setPreviewUrl(url);
            setStatus("ready");
            setProgressMessage(null);
            serverRunningRef.current = true;
          }
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "WebContainer error";

        // If boot failed, mark as unsupported for fallback
        if (
          message.includes("boot") ||
          message.includes("timed out") ||
          message.includes("SharedArrayBuffer")
        ) {
          supportedRef.current = false;
        }

        setStatus("error");
        setErrors([{ text: message }]);
        setProgressMessage(null);
      } finally {
        isBootingRef.current = false;
      }
    },
    [
      setStatus,
      setErrors,
      setPreviewUrl,
      setProgressMessage,
      appendInstallOutput,
      clearInstallOutput,
      clearConsole,
    ]
  );

  /**
   * HMR: write changed files to the WebContainer filesystem.
   * Vite picks up changes automatically.
   */
  const hmrUpdate = useCallback(
    async (files: Record<string, string>) => {
      const scaffolded = scaffoldProject(files);
      const changes: Array<[string, string]> = [];

      for (const [path, content] of Object.entries(scaffolded)) {
        if (mountedFilesRef.current[path] !== content) {
          changes.push([path, content]);
        }
      }

      if (changes.length === 0) return;

      try {
        for (const [path, content] of changes) {
          await writeFile(path, content);
          mountedFilesRef.current[path] = content;
        }
      } catch (err) {
        console.error("[WebContainer HMR]", err);
      }
    },
    []
  );

  /**
   * Handle package.json changes: stop server → reinstall → restart
   */
  const handlePackageJsonChange = useCallback(
    async (files: Record<string, string>) => {
      if (!serverRunningRef.current) return;

      try {
        serverRunningRef.current = false;
        await stopDevServer();

        setStatus("installing");
        setProgressMessage("Updating packages...");
        clearInstallOutput();

        // Write the new package.json
        const scaffolded = scaffoldProject(files);
        await writeFile("package.json", scaffolded["package.json"]);
        mountedFilesRef.current["package.json"] = scaffolded["package.json"];

        const exitCode = await runInstall((line) => {
          appendInstallOutput(line);
        });

        if (exitCode !== 0) {
          setStatus("error");
          setErrors([
            { text: `npm install failed with exit code ${exitCode}` },
          ]);
          setProgressMessage(null);
          return;
        }

        setStatus("starting");
        setProgressMessage("Restarting dev server...");

        await startDevServer(
          (line) => {
            appendInstallOutput(line);
          },
          (_port, url) => {
            setPreviewUrl(url);
            setStatus("ready");
            setProgressMessage(null);
            serverRunningRef.current = true;
          }
        );
      } catch (err) {
        setStatus("error");
        setErrors([
          {
            text:
              err instanceof Error ? err.message : "Failed to update packages",
          },
        ]);
        setProgressMessage(null);
      }
    },
    [
      setStatus,
      setErrors,
      setPreviewUrl,
      setProgressMessage,
      appendInstallOutput,
      clearInstallOutput,
    ]
  );

  // Watch generatedFiles for changes
  useEffect(() => {
    if (!supportedRef.current) return;

    const files = generatedFiles;
    const fileCount = Object.keys(files).length;

    if (fileCount === 0) {
      // No files → reset
      if (serverRunningRef.current) {
        teardown();
        serverRunningRef.current = false;
      }
      resetPreview();
      mountedFilesRef.current = {};
      return;
    }

    // Check if package.json specifically changed (needs full reinstall)
    const currentPkgJson = scaffoldProject(files)["package.json"];
    const mountedPkgJson = mountedFilesRef.current["package.json"];
    const pkgJsonChanged =
      serverRunningRef.current &&
      mountedPkgJson &&
      currentPkgJson !== mountedPkgJson;

    if (pkgJsonChanged) {
      // Debounce package.json changes (AI might still be streaming)
      if (pkgDebounceRef.current) clearTimeout(pkgDebounceRef.current);
      pkgDebounceRef.current = setTimeout(() => {
        handlePackageJsonChange(useEditorStore.getState().generatedFiles);
      }, DEBOUNCE_PKG_JSON);
      return;
    }

    if (serverRunningRef.current) {
      // Dev server is already running → HMR updates
      if (hmrDebounceRef.current) clearTimeout(hmrDebounceRef.current);
      hmrDebounceRef.current = setTimeout(() => {
        hmrUpdate(useEditorStore.getState().generatedFiles);
      }, DEBOUNCE_HMR);
      return;
    }

    // No server running yet → debounce and do full build
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const isStreaming = useChatStore.getState().isStreaming;
    const delay = isStreaming ? DEBOUNCE_STREAMING : DEBOUNCE_FIRST_MOUNT;

    debounceRef.current = setTimeout(() => {
      fullBuild(useEditorStore.getState().generatedFiles);
    }, delay);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (hmrDebounceRef.current) clearTimeout(hmrDebounceRef.current);
      if (pkgDebounceRef.current) clearTimeout(pkgDebounceRef.current);
    };
  }, [generatedFiles, fullBuild, hmrUpdate, handlePackageJsonChange, resetPreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      teardown();
      serverRunningRef.current = false;
    };
  }, []);

  return {
    serverRunning: serverRunningRef.current,
    supported: supportedRef.current,
  };
}
