"use client";

interface DiffViewProps {
  oldContent: string;
  newContent: string;
  filePath: string;
}

export function DiffView({ oldContent, newContent, filePath }: DiffViewProps) {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");

  return (
    <div className="overflow-auto rounded border text-xs font-mono">
      <div className="border-b bg-muted px-3 py-1.5 text-muted-foreground">
        {filePath}
      </div>
      <div className="grid grid-cols-2 divide-x">
        <div className="p-2">
          <div className="mb-1 text-xs font-medium text-red-400">Before</div>
          {oldLines.map((line, i) => (
            <div key={i} className="whitespace-pre text-muted-foreground">
              {line}
            </div>
          ))}
        </div>
        <div className="p-2">
          <div className="mb-1 text-xs font-medium text-green-400">After</div>
          {newLines.map((line, i) => (
            <div key={i} className="whitespace-pre">
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
