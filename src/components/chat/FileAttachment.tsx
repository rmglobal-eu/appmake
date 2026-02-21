"use client";

import { useState, useRef, useCallback } from "react";
import { Paperclip, File, Image, X, Upload } from "lucide-react";

interface AttachedFile {
  name: string;
  content: string;
  type: string;
}

interface FileAttachmentProps {
  onAttach: (files: AttachedFile[]) => void;
  maxFiles?: number;
}

interface FilePreview {
  name: string;
  content: string;
  type: string;
  preview?: string; // data URL for images
  size: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(type: string): boolean {
  return type.startsWith("image/");
}

export default function FileAttachment({
  onAttach,
  maxFiles = 5,
}: FileAttachmentProps) {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const newFiles: FilePreview[] = [];
      const filesToProcess = Array.from(fileList).slice(
        0,
        maxFiles - files.length
      );

      for (const file of filesToProcess) {
        const content = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          if (isImageType(file.type)) {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          } else {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsText(file);
          }
        });

        const preview = isImageType(file.type) ? content : undefined;

        newFiles.push({
          name: file.name,
          content,
          type: file.type || "text/plain",
          preview,
          size: file.size,
        });
      }

      setFiles((prev) => {
        const combined = [...prev, ...newFiles].slice(0, maxFiles);
        return combined;
      });
    },
    [files.length, maxFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (e.dataTransfer.files?.length) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        processFiles(e.target.files);
        // Reset input so the same file can be selected again
        e.target.value = "";
      }
    },
    [processFiles]
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleAttach = useCallback(() => {
    if (files.length === 0) return;
    onAttach(
      files.map((f) => ({
        name: f.name,
        content: f.content,
        type: f.type,
      }))
    );
    setFiles([]);
  }, [files, onAttach]);

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-150 ${
          isDragOver
            ? "border-violet-500 bg-violet-500/10"
            : "border-[#2a2a35] bg-[#0f0f14] hover:border-[#3a3a45] hover:bg-[#0f0f14]/80"
        }`}
      >
        <Upload
          className={`w-6 h-6 ${
            isDragOver ? "text-violet-400" : "text-white/30"
          } transition-colors`}
        />
        <div className="text-center">
          <p className="text-sm text-white/50">
            Drop files here or{" "}
            <span className="text-violet-400 hover:text-violet-300">
              browse
            </span>
          </p>
          <p className="text-xs text-white/25 mt-1">
            Up to {maxFiles} files
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          accept="*/*"
        />
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#1a1a22] border border-[#2a2a35] group/file"
            >
              {/* Thumbnail or icon */}
              {file.preview ? (
                <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-[#0f0f14]">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded bg-[#0f0f14] flex items-center justify-center shrink-0">
                  {isImageType(file.type) ? (
                    <Image className="w-5 h-5 text-white/30" />
                  ) : (
                    <File className="w-5 h-5 text-white/30" />
                  )}
                </div>
              )}

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80 truncate">{file.name}</p>
                <p className="text-xs text-white/30">
                  {formatFileSize(file.size)}
                </p>
              </div>

              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="p-1.5 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover/file:opacity-100 transition-all shrink-0"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Attach button */}
          <button
            onClick={handleAttach}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            <Paperclip className="w-4 h-4" />
            Attach {files.length} file{files.length > 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  );
}
