"use client";

import { X } from "lucide-react";
import { useEditorStore } from "@/lib/stores/editor-store";

export function FileTabs() {
  const { openFiles, activeFilePath, setActiveFile, closeFile } =
    useEditorStore();

  if (openFiles.length === 0) return null;

  return (
    <div className="flex border-b bg-background overflow-x-auto">
      {openFiles.map((file) => {
        const fileName = file.path.split("/").pop() || file.path;
        const isActive = file.path === activeFilePath;

        return (
          <div
            key={file.path}
            className={`group flex items-center gap-1 border-r px-3 py-1.5 text-xs cursor-pointer shrink-0 ${
              isActive
                ? "bg-background text-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
            onClick={() => setActiveFile(file.path)}
          >
            <span className="truncate max-w-[120px]">
              {file.isDirty && <span className="text-primary mr-0.5">*</span>}
              {fileName}
            </span>
            <button
              className="ml-1 rounded p-0.5 opacity-0 hover:bg-accent group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
