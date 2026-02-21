"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { NavHeader } from "@/components/NavHeader";
import { BuilderHeader } from "@/components/BuilderHeader";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { Workbench } from "@/components/workbench/Workbench";
import { ShareDialog } from "@/components/ShareDialog";
import { PublishDialog } from "@/components/PublishDialog";
import { SupabaseDialog } from "@/components/SupabaseDialog";
import { FigmaImportDialog } from "@/components/FigmaImportDialog";
import { GitPanel } from "@/components/GitPanel";
import { DomainDialog } from "@/components/DomainDialog";
import { ReviewPanel } from "@/components/ReviewPanel";
import { AuditPanel } from "@/components/AuditPanel";
import { ExportDialog } from "@/components/ExportDialog";
import { CollabDialog } from "@/components/CollabDialog";
import { useChatStore } from "@/lib/stores/chat-store";
import { useEditorStore, buildFileTree } from "@/lib/stores/editor-store";
import { useBuilderStore } from "@/lib/stores/builder-store";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSandbox } from "@/hooks/useSandbox";
import { usePreview } from "@/hooks/usePreview";
import { FileSearchDialog } from "@/components/FileSearchDialog";
import { PanelResizer } from "@/components/workbench/PanelResizer";
import { FileSyncClient } from "@/lib/ws/file-sync";
import { MessageParser } from "@/lib/parser/message-parser";
import type { ChatMessage } from "@/types/chat";

/** Extract all file actions from messages and push to editor store */
function extractFilesFromMessages(messages: ChatMessage[]) {
  try {
    const files: Record<string, string> = {};
    let firstFilePath: string | null = null;

    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      const parser = new MessageParser({
        onActionClose: (_id, action) => {
          if (action.type === "file" && action.filePath && action.content) {
            files[action.filePath] = action.content;
            if (!firstFilePath) firstFilePath = action.filePath;
          }
        },
      });
      parser.push(msg.content);
      parser.end();
    }

    console.log("[extractFiles]", Object.keys(files).length, "files found:", Object.keys(files));

    if (Object.keys(files).length > 0) {
      const store = useEditorStore.getState();
      store.addGeneratedFiles(files);
      if (firstFilePath) {
        store.openFile(firstFilePath, files[firstFilePath]);
      }
    }
  } catch (err) {
    console.error("[extractFiles] Error:", err);
  }
}

export default function ChatPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { data: session } = useSession();
  const { setMessages, clearMessages } = useChatStore();
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<"chat" | "code">("chat");
  const [refreshKey, setRefreshKey] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [fileSearchOpen, setFileSearchOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(420);
  const [supabaseOpen, setSupabaseOpen] = useState(false);
  const [figmaOpen, setFigmaOpen] = useState(false);
  const [gitOpen, setGitOpen] = useState(false);
  const [domainOpen, setDomainOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [collabOpen, setCollabOpen] = useState(false);
  const fileSyncRef = useRef<FileSyncClient | null>(null);

  // Sandbox hooks
  const sandbox = useSandbox(projectId);
  usePreview(sandbox.sandboxId, sandbox.containerId);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load project data
  useEffect(() => {
    if (!session?.user) return;

    async function init() {
      try {
        const chatRes = await fetch(`/api/chats?projectId=${projectId}`);
        const chatData = await chatRes.json();

        if (chatData?.id) {
          setChatId(chatData.id);
          const msgRes = await fetch(`/api/chats/${chatData.id}/messages`);
          const messages: ChatMessage[] = await msgRes.json();
          setMessages(messages ?? []);

          // Hydrate files: load persisted files first, then overlay message-extracted files
          try {
            const filesRes = await fetch(`/api/projects/${projectId}/files`);
            const filesData = await filesRes.json();
            if (filesData?.files && Object.keys(filesData.files).length > 0) {
              useEditorStore.getState().addGeneratedFiles(filesData.files);
            }
          } catch {
            // Files not available yet — that's fine
          }

          // Message-extracted files overlay persisted files (they may be newer)
          extractFilesFromMessages(messages ?? []);
        } else {
          const newChatRes = await fetch("/api/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          });
          const newChat = await newChatRes.json();
          if (newChat?.id) setChatId(newChat.id);
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
        toast.error("Failed to load project");
      } finally {
        setLoading(false);

        // Dispatch initial prompt from dashboard if present
        const storedPrompt = sessionStorage.getItem(`appmake_initial_prompt_${projectId}`);
        if (storedPrompt) {
          sessionStorage.removeItem(`appmake_initial_prompt_${projectId}`);
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("appmake:initial-prompt", { detail: { prompt: storedPrompt } })
            );
          }, 300);
        }
      }
    }

    init();
  }, [projectId, session, setMessages]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleTerminal: () => useBuilderStore.getState().toggleTerminal(),
    onFileSearch: () => setFileSearchOpen(true),
    onUndo: () => useEditorStore.getState().undo(),
    onRedo: () => useEditorStore.getState().redo(),
  });

  // Sandbox lifecycle: create sandbox when previewMode switches to "sandbox"
  const previewMode = useBuilderStore((s) => s.previewMode);
  useEffect(() => {
    if (previewMode === "sandbox" && !sandbox.sandboxId) {
      sandbox.createSandbox("node").then(() => {
        // Sync all existing generated files to the sandbox
        const files = useEditorStore.getState().generatedFiles;
        for (const [path, content] of Object.entries(files)) {
          sandbox.writeFile(`/workspace/${path}`, content);
        }
      }).catch((err) => {
        console.error("Failed to create sandbox:", err);
        toast.error("Failed to start sandbox");
      });
    }
  }, [previewMode, sandbox.sandboxId]);

  // File sync: sync editor changes to sandbox via WebSocket
  useEffect(() => {
    if (!sandbox.containerId) return;

    const client = new FileSyncClient();
    client.connect(sandbox.containerId);
    fileSyncRef.current = client;

    // Subscribe to editor store changes
    const unsub = useEditorStore.subscribe((state, prev) => {
      if (state.generatedFiles === prev.generatedFiles) return;
      // Find changed files
      for (const [path, content] of Object.entries(state.generatedFiles)) {
        if (prev.generatedFiles[path] !== content) {
          client.writeFile(`/workspace/${path}`, content);
        }
      }
    });

    return () => {
      unsub();
      client.disconnect();
      fileSyncRef.current = null;
    };
  }, [sandbox.containerId]);

  // File tree for search dialog
  const generatedFiles = useEditorStore((s) => s.generatedFiles);
  const fileTree = useMemo(() => buildFileTree(generatedFiles), [generatedFiles]);

  const handleFileSearchSelect = useCallback((path: string) => {
    const content = generatedFiles[path];
    if (content !== undefined) {
      useEditorStore.getState().openFile(path, content);
      useBuilderStore.getState().setViewMode("code");
    }
  }, [generatedFiles]);

  const handleChatResize = useCallback((delta: number) => {
    setChatWidth((w) => Math.max(280, Math.min(600, w + delta)));
  }, []);

  const handleSupabaseConnect = useCallback((url: string, anonKey: string) => {
    // Store Supabase config so AI can reference it
    const store = useEditorStore.getState();
    store.addGeneratedFile("supabase-config.ts", `import { createClient } from '@supabase/supabase-js';\n\nexport const SUPABASE_URL = "${url}";\nexport const SUPABASE_ANON_KEY = "${anonKey}";\nexport const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);\n`);
  }, []);

  const handleFigmaImport = useCallback((description: string, imageUrl: string | null) => {
    // Auto-send the Figma design to chat as a message
    const prompt = `Convert this Figma design to React + Tailwind code:\n\n${description}${imageUrl ? `\n\nDesign screenshot: ${imageUrl}` : ""}`;
    // Set the message in the chat store to be sent
    const chatStore = useChatStore;
    // We'll use a custom event to send the message
    window.dispatchEvent(new CustomEvent("appmake-send-message", { detail: { message: prompt } }));
  }, []);

  const headerProps = {
    onRefresh: () => setRefreshKey((k) => k + 1),
    onShare: () => setShareOpen(true),
    onPublish: () => setPublishOpen(true),
    onGit: () => setGitOpen(true),
    onSupabase: () => setSupabaseOpen(true),
    onFigma: () => setFigmaOpen(true),
    onDomain: () => setDomainOpen(true),
    onReview: () => setReviewOpen(true),
    onAudit: () => setAuditOpen(true),
    onExport: () => setExportOpen(true),
    onCollab: () => setCollabOpen(true),
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-[#0a0a10]">
        <BuilderHeader {...headerProps} />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  // Mobile
  if (isMobile) {
    return (
      <div className="flex h-screen flex-col bg-[#0a0a10]">
        <BuilderHeader {...headerProps} />
        <div className="flex shrink-0 border-b border-white/10">
          <button
            className={`flex-1 py-2 text-center text-xs font-medium ${
              mobileView === "chat"
                ? "border-b-2 border-violet-500 text-white"
                : "text-white/40"
            }`}
            onClick={() => setMobileView("chat")}
          >
            Chat
          </button>
          <button
            className={`flex-1 py-2 text-center text-xs font-medium ${
              mobileView === "code"
                ? "border-b-2 border-violet-500 text-white"
                : "text-white/40"
            }`}
            onClick={() => setMobileView("code")}
          >
            Code
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {mobileView === "chat" ? (
            chatId && <ChatPanel chatId={chatId} projectId={projectId} />
          ) : (
            <Workbench refreshKey={refreshKey} />
          )}
        </div>
        <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
        <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} />
        <SupabaseDialog open={supabaseOpen} onOpenChange={setSupabaseOpen} onConnect={handleSupabaseConnect} />
        <FigmaImportDialog open={figmaOpen} onOpenChange={setFigmaOpen} onImport={handleFigmaImport} />
        <GitPanel open={gitOpen} onOpenChange={setGitOpen} />
        <DomainDialog open={domainOpen} onOpenChange={setDomainOpen} />
        <ReviewPanel open={reviewOpen} onOpenChange={setReviewOpen} />
        <AuditPanel open={auditOpen} onOpenChange={setAuditOpen} />
        <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
        <CollabDialog open={collabOpen} onOpenChange={setCollabOpen} />
      </div>
    );
  }

  // Desktop — two panel layout
  return (
    <div className="flex h-screen flex-col bg-[#0a0a10]">
      <BuilderHeader {...headerProps} />
      <div className="flex min-h-0 flex-1">
        {/* Chat — resizable width */}
        <div className="flex shrink-0 flex-col border-r border-white/10" style={{ width: chatWidth }}>
          {chatId && <ChatPanel chatId={chatId} projectId={projectId} />}
        </div>

        {/* Panel resizer */}
        <PanelResizer direction="horizontal" onResize={handleChatResize} />

        {/* Workbench — fills remaining space */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Workbench refreshKey={refreshKey} />
        </div>
      </div>
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
      <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} />
      <SupabaseDialog open={supabaseOpen} onOpenChange={setSupabaseOpen} onConnect={handleSupabaseConnect} />
      <FigmaImportDialog open={figmaOpen} onOpenChange={setFigmaOpen} onImport={handleFigmaImport} />
      <GitPanel open={gitOpen} onOpenChange={setGitOpen} />
      <DomainDialog open={domainOpen} onOpenChange={setDomainOpen} />
      <ReviewPanel open={reviewOpen} onOpenChange={setReviewOpen} />
      <AuditPanel open={auditOpen} onOpenChange={setAuditOpen} />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <CollabDialog open={collabOpen} onOpenChange={setCollabOpen} />
      <FileSearchDialog
        open={fileSearchOpen}
        onOpenChange={setFileSearchOpen}
        files={fileTree}
        onFileSelect={handleFileSearchSelect}
      />
    </div>
  );
}
