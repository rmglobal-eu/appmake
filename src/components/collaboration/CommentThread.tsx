"use client";

import { useState, useRef, useEffect } from "react";
import { CheckCircle2, MessageSquare, Send, X } from "lucide-react";

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
}

interface CommentThreadProps {
  projectId: string;
  filePath: string;
  lineNumber: number;
  comments: Comment[];
  onAddComment: (content: string) => void;
  onResolve: () => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function CommentThread({
  projectId: _projectId,
  filePath,
  lineNumber,
  comments,
  onAddComment,
  onResolve,
}: CommentThreadProps) {
  const [replyContent, setReplyContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest comment when thread updates
  useEffect(() => {
    if (isExpanded && threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments.length, isExpanded]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [replyContent]);

  async function handleSubmit() {
    const trimmed = replyContent.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      onAddComment(trimmed);
      setReplyContent("");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="w-80 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-700 bg-zinc-800/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-300">
            {filePath}
            <span className="ml-1 text-zinc-500">L{lineNumber}</span>
          </span>
          <span className="rounded-full bg-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
            {comments.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onResolve}
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-emerald-400"
            title="Resolve thread"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <X className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "" : "rotate-45"}`} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Comments list */}
          <div className="max-h-64 overflow-y-auto">
            {comments.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-zinc-500">
                No comments yet. Start the discussion.
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {comments.map((comment) => (
                  <div key={comment.id} className="px-3 py-2.5">
                    {/* Comment author row */}
                    <div className="mb-1 flex items-center gap-2">
                      {comment.userAvatar ? (
                        <img
                          src={comment.userAvatar}
                          alt={comment.userName}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-medium text-zinc-300">
                          {comment.userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-medium text-zinc-200">
                        {comment.userName}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {formatRelativeTime(
                          comment.createdAt instanceof Date
                            ? comment.createdAt
                            : new Date(comment.createdAt)
                        )}
                      </span>
                    </div>

                    {/* Comment content */}
                    <p className="pl-7 text-xs leading-relaxed text-zinc-300 whitespace-pre-wrap break-words">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div ref={threadEndRef} />
          </div>

          {/* Reply form */}
          <div className="border-t border-zinc-700 p-2">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a reply..."
                rows={1}
                className="flex-1 resize-none rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
              />
              <button
                onClick={handleSubmit}
                disabled={!replyContent.trim() || isSubmitting}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-blue-600"
                title="Send (Cmd+Enter)"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1 text-[10px] text-zinc-500">
              Press <kbd className="rounded border border-zinc-600 px-1 font-mono">Cmd+Enter</kbd> to send
            </p>
          </div>
        </>
      )}
    </div>
  );
}
