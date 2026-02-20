"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, FileIcon, FolderIcon, FolderOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FileEntry } from "@/types/sandbox";

interface FileTreeProps {
  files: FileEntry[];
  onFileSelect: (path: string) => void;
  selectedPath?: string;
}

function FileTreeNode({
  entry,
  depth,
  onFileSelect,
  selectedPath,
}: {
  entry: FileEntry;
  depth: number;
  onFileSelect: (path: string) => void;
  selectedPath?: string;
}) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const isDir = entry.type === "directory";
  const isSelected = entry.path === selectedPath;

  return (
    <div>
      <button
        className={`flex w-full items-center gap-1 px-2 py-1 text-xs hover:bg-accent ${
          isSelected ? "bg-accent text-accent-foreground" : ""
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (isDir) {
            setIsOpen(!isOpen);
          } else {
            onFileSelect(entry.path);
          }
        }}
      >
        {isDir ? (
          <>
            {isOpen ? (
              <ChevronDown className="h-3 w-3 shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0" />
            )}
            {isOpen ? (
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            ) : (
              <FolderIcon className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            <FileIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </>
        )}
        <span className="truncate">{entry.name}</span>
      </button>
      {isDir && isOpen && entry.children && (
        <div>
          {entry.children.map((child) => (
            <FileTreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              onFileSelect={onFileSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ files, onFileSelect, selectedPath }: FileTreeProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-1">
        {files.map((entry) => (
          <FileTreeNode
            key={entry.path}
            entry={entry}
            depth={0}
            onFileSelect={onFileSelect}
            selectedPath={selectedPath}
          />
        ))}
        {files.length === 0 && (
          <p className="p-4 text-center text-xs text-muted-foreground">
            No files yet
          </p>
        )}
      </div>
    </ScrollArea>
  );
}
