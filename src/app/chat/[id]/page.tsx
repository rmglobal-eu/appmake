"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { NavHeader } from "@/components/NavHeader";
import { BuilderHeader } from "@/components/BuilderHeader";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { Workbench } from "@/components/workbench/Workbench";
import { ShareDialog } from "@/components/ShareDialog";
import { PublishDialog } from "@/components/PublishDialog";
import { useChatStore } from "@/lib/stores/chat-store";
import { useEditorStore } from "@/lib/stores/editor-store";
import { useBuilderStore } from "@/lib/stores/builder-store";
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
      }
    }

    init();
  }, [projectId, session, setMessages]);

  const headerProps = {
    onRefresh: () => setRefreshKey((k) => k + 1),
    onShare: () => setShareOpen(true),
    onPublish: () => setPublishOpen(true),
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <BuilderHeader {...headerProps} />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  // Mobile
  if (isMobile) {
    return (
      <div className="flex h-screen flex-col">
        <BuilderHeader {...headerProps} />
        <div className="flex shrink-0 border-b">
          <button
            className={`flex-1 py-2 text-center text-xs font-medium ${
              mobileView === "chat"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground"
            }`}
            onClick={() => setMobileView("chat")}
          >
            Chat
          </button>
          <button
            className={`flex-1 py-2 text-center text-xs font-medium ${
              mobileView === "code"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground"
            }`}
            onClick={() => setMobileView("code")}
          >
            Code
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {mobileView === "chat" ? (
            chatId && <ChatPanel chatId={chatId} />
          ) : (
            <Workbench refreshKey={refreshKey} />
          )}
        </div>
        <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
        <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} />
      </div>
    );
  }

  // Desktop — two panel layout
  return (
    <div className="flex h-screen flex-col">
      <BuilderHeader {...headerProps} />
      <div className="flex min-h-0 flex-1">
        {/* Chat — fixed width */}
        <div className="flex w-[420px] shrink-0 flex-col border-r">
          {chatId && <ChatPanel chatId={chatId} />}
        </div>

        {/* Workbench — fills remaining space */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Workbench refreshKey={refreshKey} />
        </div>
      </div>
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
      <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} />
    </div>
  );
}
