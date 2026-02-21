"use client";

import { useState, useCallback } from "react";
import { GitBranch, X } from "lucide-react";

interface ConversationBranchProps {
  messageId: string;
  onBranch: (fromMessageId: string) => void;
}

export default function ConversationBranch({
  messageId,
  onBranch,
}: ConversationBranchProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleBranch = useCallback(() => {
    onBranch(messageId);
    setShowConfirm(false);
  }, [messageId, onBranch]);

  if (showConfirm) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1a1a22] border border-violet-500/30 animate-in fade-in duration-150">
        <GitBranch className="w-4 h-4 text-violet-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/80">
            Create a new conversation branch from this message?
          </p>
          <p className="text-xs text-white/40 mt-0.5">
            Messages before this point will be copied to a new branch.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowConfirm(false)}
            className="p-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={handleBranch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5" />
            Branch
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-white/30 hover:text-violet-400 hover:bg-violet-500/10 transition-all duration-150 opacity-0 group-hover:opacity-100"
      title="Branch conversation from here"
    >
      <GitBranch className="w-3.5 h-3.5" />
      <span>Branch from here</span>
    </button>
  );
}
