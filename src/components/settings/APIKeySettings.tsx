"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { KeyRound, Save, Eye, EyeOff, Trash2, ShieldAlert } from "lucide-react";

interface APIKeyData {
  openaiKey: string;
  anthropicKey: string;
  openaiMasked?: string;
  anthropicMasked?: string;
}

export default function APIKeySettings() {
  const [keys, setKeys] = useState<APIKeyData>({
    openaiKey: "",
    anthropicKey: "",
  });
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.apiKeys) {
            setKeys((prev) => ({
              ...prev,
              openaiMasked: data.apiKeys.openaiMasked || "",
              anthropicMasked: data.apiKeys.anthropicMasked || "",
            }));
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
      const payload: Record<string, string> = {};
      if (keys.openaiKey) payload.openaiKey = keys.openaiKey;
      if (keys.anthropicKey) payload.anthropicKey = keys.anthropicKey;

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKeys: payload }),
      });
      if (!res.ok) throw new Error("Failed to save");

      const data = await res.json();
      if (data.apiKeys) {
        setKeys({
          openaiKey: "",
          anthropicKey: "",
          openaiMasked: data.apiKeys.openaiMasked || keys.openaiMasked,
          anthropicMasked:
            data.apiKeys.anthropicMasked || keys.anthropicMasked,
        });
      }

      toast.success("API keys saved securely");
    } catch {
      toast.error("Failed to save API keys");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear(provider: "openai" | "anthropic") {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKeys: { [`${provider}Key`]: null },
        }),
      });
      if (!res.ok) throw new Error("Failed to clear");

      setKeys((k) => ({
        ...k,
        [`${provider}Key`]: "",
        [`${provider}Masked`]: "",
      }));
      toast.success(
        `${provider === "openai" ? "OpenAI" : "Anthropic"} API key removed`
      );
    } catch {
      toast.error("Failed to remove API key");
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
            <KeyRound className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">API Keys</h1>
            <p className="text-sm text-zinc-500">
              Bring your own API keys for AI providers
            </p>
          </div>
        </div>
      </div>

      {/* Security Warning */}
      <div className="mb-8 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div>
          <p className="text-sm font-medium text-amber-300">
            Security Notice
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            Your API keys are encrypted before being stored. They are never
            exposed in logs or API responses. Only masked versions are shown
            after saving. We recommend using keys with limited permissions and
            rotating them periodically.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* OpenAI API Key */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            OpenAI API Key
          </label>
          {keys.openaiMasked && !keys.openaiKey ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm font-mono text-zinc-500">
                {keys.openaiMasked}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleClear("openai")}
                className="shrink-0 border-white/[0.06] text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <input
                type={showOpenAI ? "text" : "password"}
                value={keys.openaiKey}
                onChange={(e) =>
                  setKeys((k) => ({ ...k, openaiKey: e.target.value }))
                }
                placeholder="sk-..."
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 pr-12 text-sm font-mono text-white placeholder-zinc-600 outline-none transition-colors focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
              />
              <button
                type="button"
                onClick={() => setShowOpenAI(!showOpenAI)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showOpenAI ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
          <p className="text-xs text-zinc-600">
            Used for GPT-4o and other OpenAI models
          </p>
        </div>

        {/* Anthropic API Key */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">
            Anthropic API Key
          </label>
          {keys.anthropicMasked && !keys.anthropicKey ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm font-mono text-zinc-500">
                {keys.anthropicMasked}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleClear("anthropic")}
                className="shrink-0 border-white/[0.06] text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <input
                type={showAnthropic ? "text" : "password"}
                value={keys.anthropicKey}
                onChange={(e) =>
                  setKeys((k) => ({ ...k, anthropicKey: e.target.value }))
                }
                placeholder="sk-ant-..."
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 pr-12 text-sm font-mono text-white placeholder-zinc-600 outline-none transition-colors focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
              />
              <button
                type="button"
                onClick={() => setShowAnthropic(!showAnthropic)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showAnthropic ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
          <p className="text-xs text-zinc-600">
            Used for Claude and other Anthropic models
          </p>
        </div>

        {/* Save */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={saving || (!keys.openaiKey && !keys.anthropicKey)}
            className="gap-2 bg-orange-600 text-white hover:bg-orange-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Encrypting & Saving..." : "Save API Keys"}
          </Button>
        </div>
      </div>
    </div>
  );
}
