"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AVAILABLE_MODELS } from "@/types/chat";
import { toast } from "sonner";
import { Sparkles, Save } from "lucide-react";

interface AISettingsData {
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  autoFixEnabled: boolean;
}

const defaultSettings: AISettingsData = {
  defaultModel: AVAILABLE_MODELS[0]?.id ?? "claude-sonnet-4-20250514",
  temperature: 0.7,
  maxTokens: 4096,
  autoFixEnabled: true,
};

export default function AISettings() {
  const [settings, setSettings] = useState<AISettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.ai) {
            setSettings((prev) => ({ ...prev, ...data.ai }));
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
        body: JSON.stringify({ ai: settings }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("AI settings saved");
    } catch {
      toast.error("Failed to save AI settings");
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
            <Sparkles className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">AI Settings</h1>
            <p className="text-sm text-zinc-500">
              Configure AI model preferences and behavior
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Default Model */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            Default Model
          </label>
          <select
            value={settings.defaultModel}
            onChange={(e) =>
              setSettings((s) => ({ ...s, defaultModel: e.target.value }))
            }
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
          >
            {AVAILABLE_MODELS.map((model) => (
              <option
                key={model.id}
                value={model.id}
                className="bg-[#0f0f14] text-white"
              >
                {model.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-zinc-600">
            The AI model used for code generation and chat
          </p>
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-zinc-300">
              Temperature
            </label>
            <span className="text-sm tabular-nums text-zinc-500">
              {settings.temperature.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={settings.temperature}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                temperature: parseFloat(e.target.value),
              }))
            }
            className="w-full accent-violet-500"
          />
          <div className="flex justify-between text-xs text-zinc-600">
            <span>Precise (0)</span>
            <span>Creative (1)</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            Max Tokens
          </label>
          <input
            type="number"
            min={256}
            max={128000}
            step={256}
            value={settings.maxTokens}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                maxTokens: parseInt(e.target.value) || 4096,
              }))
            }
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
          />
          <p className="text-xs text-zinc-600">
            Maximum number of tokens per AI response (256 - 128,000)
          </p>
        </div>

        {/* Auto-fix toggle */}
        <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
          <div>
            <p className="text-sm font-medium text-zinc-300">
              Auto-fix Errors
            </p>
            <p className="mt-0.5 text-xs text-zinc-600">
              Automatically attempt to fix build and runtime errors
            </p>
          </div>
          <button
            role="switch"
            aria-checked={settings.autoFixEnabled}
            onClick={() =>
              setSettings((s) => ({
                ...s,
                autoFixEnabled: !s.autoFixEnabled,
              }))
            }
            className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
              settings.autoFixEnabled ? "bg-violet-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                settings.autoFixEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-violet-600 text-white hover:bg-violet-500"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
