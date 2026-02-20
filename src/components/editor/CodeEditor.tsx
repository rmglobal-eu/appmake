"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@/lib/stores/editor-store";
import { FileTabs } from "./FileTabs";

// CodeMirror imports — loaded dynamically to avoid SSR issues
let EditorView: typeof import("@codemirror/view").EditorView;
let EditorState: typeof import("@codemirror/state").EditorState;
let basicSetup: typeof import("codemirror").basicSetup;
let oneDark: typeof import("@codemirror/theme-one-dark").oneDark;
let javascript: typeof import("@codemirror/lang-javascript").javascript;
let html: typeof import("@codemirror/lang-html").html;
let css: typeof import("@codemirror/lang-css").css;
let json: typeof import("@codemirror/lang-json").json;
let python: typeof import("@codemirror/lang-python").python;

interface CodeEditorProps {
  onSave?: (path: string, content: string) => void;
}

function getLanguageExtension(filePath: string) {
  const ext = filePath.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "jsx":
      return javascript?.({ jsx: true });
    case "ts":
    case "tsx":
      return javascript?.({ jsx: true, typescript: true });
    case "html":
      return html?.();
    case "css":
    case "scss":
      return css?.();
    case "json":
      return json?.();
    case "py":
      return python?.();
    default:
      return null;
  }
}

export function CodeEditor({ onSave }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<InstanceType<typeof import("@codemirror/view").EditorView> | null>(null);
  const { openFiles, activeFilePath, updateFileContent } = useEditorStore();
  const activeFile = openFiles.find((f) => f.path === activeFilePath);
  const loadedRef = useRef(false);

  // Load CodeMirror modules dynamically
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    Promise.all([
      import("@codemirror/view"),
      import("@codemirror/state"),
      import("codemirror"),
      import("@codemirror/theme-one-dark"),
      import("@codemirror/lang-javascript"),
      import("@codemirror/lang-html"),
      import("@codemirror/lang-css"),
      import("@codemirror/lang-json"),
      import("@codemirror/lang-python"),
    ]).then(([viewMod, stateMod, cmMod, themeMod, jsMod, htmlMod, cssMod, jsonMod, pyMod]) => {
      EditorView = viewMod.EditorView;
      EditorState = stateMod.EditorState;
      basicSetup = cmMod.basicSetup;
      oneDark = themeMod.oneDark;
      javascript = jsMod.javascript;
      html = htmlMod.html;
      css = cssMod.css;
      json = jsonMod.json;
      python = pyMod.python;
    });
  }, []);

  const createEditor = useCallback(() => {
    if (!containerRef.current || !activeFile || !EditorView || !EditorState) return;

    // Destroy old view
    viewRef.current?.destroy();

    const extensions = [
      basicSetup,
      oneDark,
      EditorView.updateListener.of((update) => {
        if (update.docChanged && activeFilePath) {
          updateFileContent(activeFilePath, update.state.doc.toString());
        }
      }),
      EditorView.domEventHandlers({
        keydown(event) {
          if ((event.metaKey || event.ctrlKey) && event.key === "s") {
            event.preventDefault();
            if (activeFilePath && viewRef.current) {
              onSave?.(
                activeFilePath,
                viewRef.current.state.doc.toString()
              );
            }
          }
        },
      }),
    ];

    const langExt = getLanguageExtension(activeFile.path);
    if (langExt) extensions.push(langExt);

    const state = EditorState.create({
      doc: activeFile.content,
      extensions,
    });

    viewRef.current = new EditorView({
      state,
      parent: containerRef.current,
    });
  }, [activeFile, activeFilePath, updateFileContent, onSave]);

  useEffect(() => {
    // Small delay to ensure CodeMirror modules are loaded
    const timer = setTimeout(createEditor, 50);
    return () => {
      clearTimeout(timer);
      viewRef.current?.destroy();
    };
  }, [createEditor]);

  if (!activeFile) {
    return (
      <div className="flex h-full flex-col">
        <FileTabs />
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Select a file to edit
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <FileTabs />
      <div ref={containerRef} className="flex-1 overflow-auto" />
    </div>
  );
}
