"use client";

import { useState, useRef, useCallback } from "react";
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

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isStreaming: boolean;
  selectedModel: ModelOption;
  onModelChange: (model: ModelOption) => void;
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  selectedModel,
  onModelChange,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { planMode, setPlanMode, visualEditorActive, setVisualEditorActive } =
    useBuilderStore();

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput("");
    textareaRef.current?.focus();
  }, [input, isStreaming, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const comingSoon = () => toast("Coming soon!", { duration: 1500 });

  const placeholder = visualEditorActive
    ? "Ask Appmake to modify the selected element..."
    : planMode
      ? "Describe what you want — AI will plan first..."
      : "Ask Appmake to build something...";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="shrink-0 border-t p-3">
        {/* Main input row */}
        <div className="flex items-end gap-2">
          {/* Attach button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-[44px] w-9 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={comingSoon}>
                <ImageIcon className="mr-2 h-4 w-4" />
                Upload image
              </DropdownMenuItem>
              <DropdownMenuItem onClick={comingSoon}>
                <FileText className="mr-2 h-4 w-4" />
                Add file context
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[44px] max-h-[160px] resize-none text-sm"
            rows={1}
          />

          {isStreaming ? (
            <Button
              onClick={onStop}
              size="icon"
              variant="destructive"
              className="h-[44px] w-[44px] shrink-0"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              size="icon"
              disabled={!input.trim()}
              className="h-[44px] w-[44px] shrink-0"
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
                className="h-6 px-2 text-[11px] text-muted-foreground"
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
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
                className="h-6 w-6 ml-1 text-muted-foreground"
                onClick={comingSoon}
              >
                <Mic className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voice input (coming soon)</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
