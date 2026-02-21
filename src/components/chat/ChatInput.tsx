"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  Square,
  ChevronDown,
  Plus,
  ImageIcon,
  FileText,
  Pencil,
  ListChecks,
  Mic,
} from "lucide-react";
import { toast } from "sonner";
import { AVAILABLE_MODELS, type ModelOption } from "@/types/chat";
import { useBuilderStore } from "@/lib/stores/builder-store";

interface UsageData {
  used: number;
  limit: number;
  resetsAt: string | null;
}

export interface UploadedImage {
  url: string;
  filename: string;
}

interface ChatInputProps {
  onSend: (message: string, images?: UploadedImage[]) => void;
  onStop?: () => void;
  isStreaming: boolean;
  selectedModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
  usageRefreshKey?: number;
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  selectedModel,
  onModelChange,
  usageRefreshKey,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { planMode, setPlanMode, visualEditorActive, setVisualEditorActive } =
    useBuilderStore();
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((data) => setUsage(data))
      .catch(() => {});
  }, [usageRefreshKey]);

  const atLimit = usage !== null && usage.used >= usage.limit;

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || atLimit) return;
    onSend(trimmed, uploadedImages.length > 0 ? uploadedImages : undefined);
    setInput("");
    setUploadedImages([]);
    textareaRef.current?.focus();
  }, [input, isStreaming, atLimit, onSend, uploadedImages]);

  const handleImageUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      setUploadedImages((prev) => [...prev, { url: data.url, filename: data.filename }]);
    } catch (err) {
      toast.error((err as Error).message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) handleImageUpload(file);
          return;
        }
      }
    },
    [handleImageUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if we actually left the container (not a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const files = e.dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith("image/")) {
          handleImageUpload(files[i]);
        }
      }
    },
    [handleImageUpload]
  );

  const comingSoon = () => toast("Coming soon!", { duration: 1500 });

  const placeholder = visualEditorActive
    ? "Ask Appmake to modify the selected element..."
    : planMode
      ? "Describe what you want — AI will plan first..."
      : "Ask Appmake to build something...";

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={`shrink-0 border-t bg-[#0f0f14]/60 p-3 backdrop-blur-sm transition-colors ${
          isDragOver
            ? "border-violet-500/50 bg-violet-500/5"
            : "border-white/10"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Uploaded images preview */}
        {uploadedImages.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {uploadedImages.map((img, i) => (
              <div key={i} className="group relative h-16 w-16 rounded-md border border-white/15 overflow-hidden">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setUploadedImages((prev) => prev.filter((_, j) => j !== i))}
                >
                  <span className="text-white text-xs">Remove</span>
                </button>
              </div>
            ))}
            {isUploading && (
              <div className="flex h-16 w-16 items-center justify-center rounded-md border border-white/15">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
              </div>
            )}
          </div>
        )}
        {/* Drag-over indicator */}
        {isDragOver && (
          <div className="mb-2 flex items-center justify-center rounded-lg border-2 border-dashed border-violet-500/40 bg-violet-500/5 py-4">
            <span className="text-xs text-violet-400 font-medium">
              Drop image here
            </span>
          </div>
        )}
        {/* Main input row */}
        <div className="flex items-end gap-2">
          {/* Attach button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-[44px] w-9 shrink-0 text-white/40 hover:text-white/80 hover:bg-white/10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="mr-2 h-4 w-4" />
                Upload image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={comingSoon}>
                <FileText className="mr-2 h-4 w-4" />
                Add file context
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hidden file input for image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
              e.target.value = "";
            }}
          />

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            className="min-h-[44px] max-h-[160px] resize-none text-sm rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/30 backdrop-blur-md focus-visible:border-white/30 focus-visible:ring-white/10 shadow-none"
            rows={1}
          />

          {isStreaming ? (
            <Button
              onClick={onStop}
              size="icon"
              className="h-[44px] w-[44px] shrink-0 bg-red-500/80 hover:bg-red-500 text-white border-0"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              size="icon"
              disabled={!input.trim() || (usage !== null && usage.used >= usage.limit)}
              className="h-[44px] w-[44px] shrink-0 bg-white text-black hover:bg-white/90 disabled:bg-white/20 disabled:text-white/30 border-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Bottom row: model selector + toggles */}
        <div className="mt-1.5 flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[11px] text-white/40 hover:text-white/70 hover:bg-white/10"
              >
                {selectedModel.name}
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {AVAILABLE_MODELS.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => onModelChange(model)}
                >
                  <span className="flex-1">{model.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {model.provider}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          {/* Visual edits toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  visualEditorActive
                    ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white"
                    : "text-white/40 hover:text-white/70 hover:bg-white/10"
                }`}
                onClick={() => setVisualEditorActive(!visualEditorActive)}
              >
                <Pencil className="h-3 w-3" />
                Visual edits
              </button>
            </TooltipTrigger>
            <TooltipContent>Click elements in preview to edit visually</TooltipContent>
          </Tooltip>

          {/* Plan toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ml-1 ${
                  planMode
                    ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white"
                    : "text-white/40 hover:text-white/70 hover:bg-white/10"
                }`}
                onClick={() => setPlanMode(!planMode)}
              >
                <ListChecks className="h-3 w-3" />
                Plan
              </button>
            </TooltipTrigger>
            <TooltipContent>AI will plan before writing code</TooltipContent>
          </Tooltip>

          {/* Mic placeholder */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-1 text-white/30 hover:text-white/60 hover:bg-white/10"
                onClick={comingSoon}
              >
                <Mic className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voice input (coming soon)</TooltipContent>
          </Tooltip>
        </div>

        {/* Usage indicator */}
        {usage !== null && (
          <UsageBar usage={usage} />
        )}
      </div>
    </TooltipProvider>
  );
}

function UsageBar({ usage }: { usage: UsageData }) {
  const pct = Math.min((usage.used / usage.limit) * 100, 100);
  const atLimit = usage.used >= usage.limit;

  const barColor =
    pct < 50
      ? "bg-green-500"
      : pct < 80
        ? "bg-yellow-500"
        : "bg-red-500";

  // Time until reset
  let resetLabel = "";
  if (atLimit && usage.resetsAt) {
    const ms = new Date(usage.resetsAt).getTime() - Date.now();
    if (ms > 0) {
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      resetLabel = `Resets in ${h}h ${m}m`;
    }
  }

  return (
    <div className="mt-1.5 space-y-1">
      <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-white/30">
        <span>
          {usage.used} / {usage.limit} messages
        </span>
        {resetLabel && (
          <span className="text-red-500 font-medium">{resetLabel}</span>
        )}
      </div>
    </div>
  );
}
