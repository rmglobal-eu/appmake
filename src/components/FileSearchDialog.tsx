"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FileIcon, FolderIcon } from "lucide-react";
import type { FileEntry } from "@/types/sandbox";

interface FileSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: FileEntry[];
  onFileSelect: (path: string) => void;
}

function flattenFiles(entries: FileEntry[], result: FileEntry[] = []): FileEntry[] {
  for (const entry of entries) {
    if (entry.type === "file") {
      result.push(entry);
    }
    if (entry.children) {
      flattenFiles(entry.children, result);
    }
  }
  return result;
}

export function FileSearchDialog({
  open,
  onOpenChange,
  files,
  onFileSelect,
}: FileSearchDialogProps) {
  const flatFiles = flattenFiles(files);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search files..." />
      <CommandList>
        <CommandEmpty>No files found.</CommandEmpty>
        <CommandGroup heading="Files">
          {flatFiles.map((file) => (
            <CommandItem
              key={file.path}
              value={file.path}
              onSelect={() => {
                onFileSelect(file.path);
                onOpenChange(false);
              }}
            >
              <FileIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {file.path.replace("/workspace/", "")}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
