"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Code2, Save } from "lucide-react";

interface EditorSettingsData {
  theme: "oneDark" | "light";
  fontSize: number;
  tabSize: 2 | 4;
  lineNumbers: boolean;
  wordWrap: boolean;
  minimap: boolean;
}

const defaultSettings: EditorSettingsData = {
  theme: "oneDark",
  fontSize: 14,
  tabSize: 2,
  lineNumbers: true,
  wordWrap: true,
  minimap: false,
};

export default function EditorSettings() {
  const [settings, setSettings] = useState<EditorSettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.editor) {
            setSettings((prev) => ({ ...prev, ...data.editor }));
          }
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editor: settings }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Editor settings saved");
    } catch {
      toast.error("Failed to save editor settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Code2 className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">
              Editor Settings
            </h1>
            <p className="text-sm text-zinc-500">
              Customize the code editor appearance and behavior
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Theme */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            Theme
          </label>
          <select
            value={settings.theme}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                theme: e.target.value as "oneDark" | "light",
              }))
            }
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
          >
            <option value="oneDark" className="bg-[#0f0f14] text-white">
              One Dark
            </option>
            <option value="light" className="bg-[#0f0f14] text-white">
              Light
            </option>
          </select>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-zinc-300">
              Font Size
            </label>
            <span className="text-sm tabular-nums text-zinc-500">
              {settings.fontSize}px
            </span>
          </div>
          <input
            type="range"
            min={12}
            max={24}
            step={1}
            value={settings.fontSize}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                fontSize: parseInt(e.target.value),
              }))
            }
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-zinc-600">
            <span>12px</span>
            <span>24px</span>
          </div>
        </div>

        {/* Tab Size */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-300">
            Tab Size
          </label>
          <div className="flex gap-4">
            {([2, 4] as const).map((size) => (
              <label
                key={size}
                className="flex cursor-pointer items-center gap-2.5"
              >
                <input
                  type="radio"
                  name="tabSize"
                  value={size}
                  checked={settings.tabSize === size}
                  onChange={() => setSettings((s) => ({ ...s, tabSize: size }))}
                  className="h-4 w-4 border-zinc-600 bg-transparent text-blue-500 focus:ring-blue-500/20"
                />
                <span className="text-sm text-zinc-300">
                  {size} spaces
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          {(
            [
              {
                key: "lineNumbers" as const,
                label: "Line Numbers",
                desc: "Show line numbers in the gutter",
              },
              {
                key: "wordWrap" as const,
                label: "Word Wrap",
                desc: "Wrap long lines to fit the editor width",
              },
              {
                key: "minimap" as const,
                label: "Minimap",
                desc: "Show a miniature preview of the code on the right",
              },
            ] as const
          ).map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div>
                <p className="text-sm font-medium text-zinc-300">
                  {item.label}
                </p>
                <p className="mt-0.5 text-xs text-zinc-600">{item.desc}</p>
              </div>
              <button
                role="switch"
                aria-checked={settings[item.key]}
                onClick={() =>
                  setSettings((s) => ({ ...s, [item.key]: !s[item.key] }))
                }
                className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                  settings[item.key] ? "bg-blue-500" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    settings[item.key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Save */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-blue-600 text-white hover:bg-blue-500"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
