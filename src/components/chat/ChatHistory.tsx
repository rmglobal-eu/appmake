"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ChatEntry {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatHistoryProps {
  projectId: string;
  activeChatId: string | null;
  onChatSelect: (chatId: string) => void;
}

export function ChatHistory({
  projectId,
  activeChatId,
  onChatSelect,
}: ChatHistoryProps) {
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchChats();
  }, [projectId]);

  async function fetchChats() {
    try {
      const res = await fetch(`/api/chats/list?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setChats(data ?? []);
      }
    } catch {
      // Ignore
    }
  }

  async function createChat() {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (res.ok) {
        const chat = await res.json();
        setChats((prev) => [chat, ...prev]);
        onChatSelect(chat.id);
        toast.success("New chat created");
      }
    } catch {
      toast.error("Failed to create chat");
    }
  }

  async function deleteChat(chatId: string) {
    try {
      await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId && chats.length > 1) {
        const next = chats.find((c) => c.id !== chatId);
        if (next) onChatSelect(next.id);
      }
      toast.success("Chat deleted");
    } catch {
      toast.error("Failed to delete chat");
    }
  }

  return (
    <div className="flex h-full flex-col border-r">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-medium">Chats</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={createChat}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer ${
                chat.id === activeChatId
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              }`}
              onClick={() => onChatSelect(chat.id)}
            >
              <MessageSquare className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{chat.title}</span>
              <button
                className="shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {chats.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              No chats yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
