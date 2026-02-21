"use client";

import { useState, useCallback } from "react";
import { Copy, RefreshCw, Pencil, Trash2, Check, X } from "lucide-react";

interface MessageActionsProps {
  messageId: string;
  content: string;
  role: "user" | "assistant";
  onRetry?: (content: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
}

export default function MessageActions({
  messageId,
  content,
  role,
  onRetry,
  onEdit,
  onDelete,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [content]);

  const handleRetry = useCallback(() => {
    onRetry?.(content);
  }, [content, onRetry]);

  const handleEditSubmit = useCallback(() => {
    if (editContent.trim() && editContent !== content) {
      onEdit?.(messageId, editContent);
    }
    setIsEditing(false);
  }, [editContent, content, messageId, onEdit]);

  const handleEditCancel = useCallback(() => {
    setEditContent(content);
    setIsEditing(false);
  }, [content]);

  const handleDelete = useCallback(() => {
    onDelete?.(messageId);
    setShowDeleteConfirm(false);
  }, [messageId, onDelete]);

  if (isEditing) {
    return (
      <div className="mt-2 flex flex-col gap-2">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full bg-[#0f0f14] border border-[#2a2a35] rounded-lg px-3 py-2 text-sm text-white/90 resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 min-h-[80px]"
          rows={3}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handleEditSubmit();
            }
            if (e.key === "Escape") {
              handleEditCancel();
            }
          }}
        />
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={handleEditCancel}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            onClick={handleEditSubmit}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs bg-violet-600 text-white hover:bg-violet-500 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>
    );
  }

  if (showDeleteConfirm) {
    return (
      <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
        <span className="text-xs text-red-400">Delete this message?</span>
        <button
          onClick={handleDelete}
          className="px-2 py-1 rounded text-xs bg-red-600 text-white hover:bg-red-500 transition-colors"
        >
          Delete
        </button>
        <button
          onClick={() => setShowDeleteConfirm(false)}
          className="px-2 py-1 rounded text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      {/* Copy */}
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-md text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
        title="Copy message"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Retry - only for user messages or to regenerate assistant responses */}
      {onRetry && (
        <button
          onClick={handleRetry}
          className="p-1.5 rounded-md text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
          title={role === "user" ? "Resend message" : "Regenerate response"}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Edit - primarily for user messages */}
      {onEdit && (
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 rounded-md text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
          title="Edit message"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Delete */}
      {onDelete && (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-1.5 rounded-md text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Delete message"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
