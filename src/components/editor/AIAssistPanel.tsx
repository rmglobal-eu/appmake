"use client";

import { useState, useCallback } from "react";
import { Sparkles, Wand2, TestTube2, FileText, ArrowRight, X } from "lucide-react";
import { useEditorStore } from "@/lib/stores/editor-store";

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  endpoint: string;
}

const quickActions: QuickAction[] = [
  {
    id: "explain",
    label: "Explain",
    description: "Get a clear explanation of the selected code",
    icon: <Sparkles className="w-4 h-4" />,
    endpoint: "/api/ai/explain",
  },
  {
    id: "refactor",
    label: "Refactor",
    description: "Get suggestions to improve code quality",
    icon: <Wand2 className="w-4 h-4" />,
    endpoint: "/api/ai/refactor",
  },
  {
    id: "test",
    label: "Add Tests",
    description: "Generate test templates for the current file",
    icon: <TestTube2 className="w-4 h-4" />,
    endpoint: "/api/ai/test",
  },
  {
    id: "docs",
    label: "Add Docs",
    description: "Generate JSDoc documentation",
    icon: <FileText className="w-4 h-4" />,
    endpoint: "/api/ai/docs",
  },
];

export default function AIAssistPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeFile = useEditorStore((s) => s.activeFilePath);
  const files = useEditorStore((s) => s.generatedFiles);

  const currentCode = activeFile && files ? files[activeFile] ?? "" : "";
  const language = activeFile?.endsWith(".tsx")
    ? "tsx"
    : activeFile?.endsWith(".ts")
      ? "typescript"
      : activeFile?.endsWith(".jsx")
        ? "jsx"
        : activeFile?.endsWith(".js")
          ? "javascript"
          : activeFile?.endsWith(".css")
            ? "css"
            : "text";

  const handleAction = useCallback(
    async (action: QuickAction) => {
      if (!activeFile || !currentCode) return;

      setActiveAction(action.id);
      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const response = await fetch(action.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: currentCode,
            language,
            filePath: activeFile,
          }),
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const data = await response.json();
        setResult(JSON.stringify(data, null, 2));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [activeFile, currentCode, language]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleClearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setActiveAction(null);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 bottom-4 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full shadow-lg border border-zinc-700 transition-colors"
        title="Open AI Assist"
      >
        <Sparkles className="w-5 h-5 text-purple-400" />
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-zinc-100">AI Assist</h2>
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-zinc-800 rounded transition-colors"
        >
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Active File Info */}
      <div className="px-4 py-2 border-b border-zinc-800">
        <div className="text-xs text-zinc-500 mb-1">Active File</div>
        <div className="text-sm text-zinc-300 truncate">
          {activeFile || "No file selected"}
        </div>
        {activeFile && (
          <div className="text-xs text-zinc-600 mt-0.5">
            {language} / {currentCode.split("\n").length} lines
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
          Quick Actions
        </div>
        <div className="space-y-1">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={!activeFile || isLoading}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors group ${
                activeAction === action.id
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "hover:bg-zinc-800 text-zinc-300 border border-transparent"
              } ${!activeFile || isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span
                className={`${
                  activeAction === action.id
                    ? "text-purple-400"
                    : "text-zinc-500 group-hover:text-zinc-300"
                } transition-colors`}
              >
                {action.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{action.label}</div>
                <div className="text-xs text-zinc-500 truncate">
                  {action.description}
                </div>
              </div>
              <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Result Area */}
      <div className="flex-1 overflow-auto px-4 py-3">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-zinc-400">
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Analyzing code...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="text-xs text-red-400 font-medium mb-1">Error</div>
            <div className="text-sm text-red-300">{error}</div>
            <button
              onClick={handleClearResult}
              className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {result && !isLoading && !error && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-zinc-500 uppercase tracking-wider">
                Result
              </div>
              <button
                onClick={handleClearResult}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear
              </button>
            </div>
            <pre className="text-xs text-zinc-300 bg-zinc-950 rounded-lg p-3 overflow-auto whitespace-pre-wrap font-mono border border-zinc-800">
              {result}
            </pre>
          </div>
        )}

        {!isLoading && !error && !result && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="w-8 h-8 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">
              Select a file and choose an action to get AI-powered insights.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
