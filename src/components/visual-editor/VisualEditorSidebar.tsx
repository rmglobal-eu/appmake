"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useBuilderStore,
  type SelectedElement,
} from "@/lib/stores/builder-store";
import { useVisualEditorSync } from "@/hooks/useVisualEditorSync";
import {
  Type,
  Palette,
  Box,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MousePointer2,
} from "lucide-react";

export function VisualEditorSidebar() {
  const { selectedElement } = useBuilderStore();
  const syncAndApply = useVisualEditorSync();

  if (!selectedElement) {
    return (
      <div className="flex h-full w-[280px] shrink-0 flex-col border-r bg-background">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <MousePointer2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Visual Editor</span>
        </div>
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="text-center text-muted-foreground">
            <MousePointer2 className="mx-auto mb-2 h-8 w-8 opacity-30" />
            <p className="text-sm font-medium">No element selected</p>
            <p className="mt-1 text-xs">Click an element in the preview to edit it</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-r bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <div className="rounded bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 text-[10px] font-mono text-violet-700 dark:text-violet-300">
          &lt;{selectedElement.tagName}&gt;
        </div>
        <span className="text-xs text-muted-foreground truncate flex-1">
          {selectedElement.text.slice(0, 40)}
          {selectedElement.text.length > 40 ? "..." : ""}
        </span>
      </div>

      {/* Panels */}
      <div className="flex-1 overflow-y-auto">
        <TextPanel element={selectedElement} onApply={syncAndApply} />
        <ColorsPanel element={selectedElement} onApply={syncAndApply} />
        <SpacingPanel element={selectedElement} onApply={syncAndApply} />
        <TypographyPanel element={selectedElement} onApply={syncAndApply} />
      </div>
    </div>
  );
}

interface PanelProps {
  element: SelectedElement;
  onApply: (payload: { text?: string; styles?: Record<string, string> }) => void;
}

function PanelHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border-b bg-muted/30">
      {icon}
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className="text-[11px] text-muted-foreground w-20 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function TextPanel({ element, onApply }: PanelProps) {
  const [text, setText] = useState(element.text);

  useEffect(() => {
    setText(element.text);
  }, [element.text]);

  return (
    <div>
      <PanelHeader icon={<Type className="h-3 w-3" />} label="Text" />
      <div className="px-3 py-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-md border bg-background px-2 py-1.5 text-xs resize-none"
          rows={3}
        />
        <Button
          size="sm"
          variant="secondary"
          className="mt-1 h-6 w-full text-[11px]"
          onClick={() => onApply({ text })}
        >
          Apply text
        </Button>
      </div>
    </div>
  );
}

function ColorsPanel({ element, onApply }: PanelProps) {
  const [color, setColor] = useState(element.styles.color || "");
  const [bgColor, setBgColor] = useState(element.styles.backgroundColor || "");

  useEffect(() => {
    setColor(element.styles.color || "");
    setBgColor(element.styles.backgroundColor || "");
  }, [element.styles.color, element.styles.backgroundColor]);

  const apply = useCallback(() => {
    const styles: Record<string, string> = {};
    if (color) styles.color = color;
    if (bgColor) styles.backgroundColor = bgColor;
    onApply({ styles });
  }, [color, bgColor, onApply]);

  return (
    <div>
      <PanelHeader icon={<Palette className="h-3 w-3" />} label="Colors" />
      <FieldRow label="Text color">
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={rgbToHex(color)}
            onChange={(e) => setColor(e.target.value)}
            className="h-6 w-6 cursor-pointer rounded border"
          />
          <Input
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-6 text-[11px] font-mono"
          />
        </div>
      </FieldRow>
      <FieldRow label="Background">
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={rgbToHex(bgColor)}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-6 w-6 cursor-pointer rounded border"
          />
          <Input
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-6 text-[11px] font-mono"
          />
        </div>
      </FieldRow>
      <div className="px-3 py-1">
        <Button
          size="sm"
          variant="secondary"
          className="h-6 w-full text-[11px]"
          onClick={apply}
        >
          Apply colors
        </Button>
      </div>
    </div>
  );
}

function SpacingPanel({ element, onApply }: PanelProps) {
  const [pt, setPt] = useState(element.styles.paddingTop || "0px");
  const [pr, setPr] = useState(element.styles.paddingRight || "0px");
  const [pb, setPb] = useState(element.styles.paddingBottom || "0px");
  const [pl, setPl] = useState(element.styles.paddingLeft || "0px");
  const [mt, setMt] = useState(element.styles.marginTop || "0px");
  const [mr, setMr] = useState(element.styles.marginRight || "0px");
  const [mb, setMb] = useState(element.styles.marginBottom || "0px");
  const [ml, setMl] = useState(element.styles.marginLeft || "0px");

  useEffect(() => {
    setPt(element.styles.paddingTop || "0px");
    setPr(element.styles.paddingRight || "0px");
    setPb(element.styles.paddingBottom || "0px");
    setPl(element.styles.paddingLeft || "0px");
    setMt(element.styles.marginTop || "0px");
    setMr(element.styles.marginRight || "0px");
    setMb(element.styles.marginBottom || "0px");
    setMl(element.styles.marginLeft || "0px");
  }, [element.styles]);

  const apply = useCallback(() => {
    onApply({
      styles: {
        paddingTop: pt,
        paddingRight: pr,
        paddingBottom: pb,
        paddingLeft: pl,
        marginTop: mt,
        marginRight: mr,
        marginBottom: mb,
        marginLeft: ml,
      },
    });
  }, [pt, pr, pb, pl, mt, mr, mb, ml, onApply]);

  return (
    <div>
      <PanelHeader icon={<Box className="h-3 w-3" />} label="Spacing" />
      <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground">Padding</div>
      <div className="grid grid-cols-2 gap-1.5 px-3">
        <SpacingInput label="Top" value={pt} onChange={setPt} />
        <SpacingInput label="Right" value={pr} onChange={setPr} />
        <SpacingInput label="Bottom" value={pb} onChange={setPb} />
        <SpacingInput label="Left" value={pl} onChange={setPl} />
      </div>
      <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground mt-1">Margin</div>
      <div className="grid grid-cols-2 gap-1.5 px-3">
        <SpacingInput label="Top" value={mt} onChange={setMt} />
        <SpacingInput label="Right" value={mr} onChange={setMr} />
        <SpacingInput label="Bottom" value={mb} onChange={setMb} />
        <SpacingInput label="Left" value={ml} onChange={setMl} />
      </div>
      <div className="px-3 py-2">
        <Button
          size="sm"
          variant="secondary"
          className="h-6 w-full text-[11px]"
          onClick={apply}
        >
          Apply spacing
        </Button>
      </div>
    </div>
  );
}

function SpacingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-muted-foreground w-9">{label}</span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-5 text-[10px] font-mono px-1"
      />
    </div>
  );
}

function TypographyPanel({ element, onApply }: PanelProps) {
  const [fontSize, setFontSize] = useState(element.styles.fontSize || "16px");
  const [fontWeight, setFontWeight] = useState(element.styles.fontWeight || "400");
  const [lineHeight, setLineHeight] = useState(element.styles.lineHeight || "normal");
  const [letterSpacing, setLetterSpacing] = useState(element.styles.letterSpacing || "normal");
  const [textAlign, setTextAlign] = useState(element.styles.textAlign || "left");

  useEffect(() => {
    setFontSize(element.styles.fontSize || "16px");
    setFontWeight(element.styles.fontWeight || "400");
    setLineHeight(element.styles.lineHeight || "normal");
    setLetterSpacing(element.styles.letterSpacing || "normal");
    setTextAlign(element.styles.textAlign || "left");
  }, [element.styles]);

  const apply = useCallback(() => {
    onApply({
      styles: { fontSize, fontWeight, lineHeight, letterSpacing, textAlign },
    });
  }, [fontSize, fontWeight, lineHeight, letterSpacing, textAlign, onApply]);

  return (
    <div>
      <PanelHeader icon={<Type className="h-3 w-3" />} label="Typography" />
      <FieldRow label="Font size">
        <Input
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          className="h-6 text-[11px] font-mono"
        />
      </FieldRow>
      <FieldRow label="Weight">
        <select
          value={fontWeight}
          onChange={(e) => setFontWeight(e.target.value)}
          className="h-6 w-full rounded-md border bg-background px-1 text-[11px]"
        >
          <option value="100">100 - Thin</option>
          <option value="200">200 - Extra Light</option>
          <option value="300">300 - Light</option>
          <option value="400">400 - Regular</option>
          <option value="500">500 - Medium</option>
          <option value="600">600 - Semibold</option>
          <option value="700">700 - Bold</option>
          <option value="800">800 - Extra Bold</option>
          <option value="900">900 - Black</option>
        </select>
      </FieldRow>
      <FieldRow label="Line height">
        <Input
          value={lineHeight}
          onChange={(e) => setLineHeight(e.target.value)}
          className="h-6 text-[11px] font-mono"
        />
      </FieldRow>
      <FieldRow label="Spacing">
        <Input
          value={letterSpacing}
          onChange={(e) => setLetterSpacing(e.target.value)}
          className="h-6 text-[11px] font-mono"
        />
      </FieldRow>
      <FieldRow label="Align">
        <div className="flex items-center gap-0.5 rounded-md border bg-muted/30 p-0.5">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              className={`rounded p-1 ${
                textAlign === align
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setTextAlign(align)}
            >
              {align === "left" && <AlignLeft className="h-3 w-3" />}
              {align === "center" && <AlignCenter className="h-3 w-3" />}
              {align === "right" && <AlignRight className="h-3 w-3" />}
            </button>
          ))}
        </div>
      </FieldRow>
      <div className="px-3 py-2">
        <Button
          size="sm"
          variant="secondary"
          className="h-6 w-full text-[11px]"
          onClick={apply}
        >
          Apply typography
        </Button>
      </div>
    </div>
  );
}

/** Helper: convert rgb(r,g,b) to hex for color input */
function rgbToHex(color: string): string {
  if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") return "#ffffff";
  if (color.startsWith("#")) return color;

  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return "#000000";

  const r = parseInt(match[1]).toString(16).padStart(2, "0");
  const g = parseInt(match[2]).toString(16).padStart(2, "0");
  const b = parseInt(match[3]).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}
