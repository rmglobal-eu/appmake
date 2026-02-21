"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, Save } from "lucide-react";

interface NotificationSettingsData {
  emailNotifications: boolean;
  buildFailures: boolean;
  collaborationInvites: boolean;
  weeklySummary: boolean;
  marketingEmails: boolean;
}

const defaultSettings: NotificationSettingsData = {
  emailNotifications: true,
  buildFailures: true,
  collaborationInvites: true,
  weeklySummary: false,
  marketingEmails: false,
};

const toggleItems: {
  key: keyof NotificationSettingsData;
  label: string;
  desc: string;
}[] = [
  {
    key: "emailNotifications",
    label: "Email Notifications",
    desc: "Receive notifications via email",
  },
  {
    key: "buildFailures",
    label: "Build Failures",
    desc: "Get notified when a build fails",
  },
  {
    key: "collaborationInvites",
    label: "Collaboration Invites",
    desc: "Receive invites from collaborators",
  },
  {
    key: "weeklySummary",
    label: "Weekly Summary",
    desc: "Receive a weekly summary of your activity",
  },
  {
    key: "marketingEmails",
    label: "Marketing Emails",
    desc: "Receive product updates and offers",
  },
];

export default function NotificationSettings() {
  const [settings, setSettings] =
    useState<NotificationSettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.notifications) {
            setSettings((prev) => ({ ...prev, ...data.notifications }));
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
        body: JSON.stringify({ notifications: settings }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Notification settings saved");
    } catch {
      toast.error("Failed to save notification settings");
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <Bell className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Notifications</h1>
            <p className="text-sm text-zinc-500">
              Choose what notifications you want to receive
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {toggleItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <div>
              <p className="text-sm font-medium text-zinc-300">{item.label}</p>
              <p className="mt-0.5 text-xs text-zinc-600">{item.desc}</p>
            </div>
            <button
              role="switch"
              aria-checked={settings[item.key]}
              onClick={() =>
                setSettings((s) => ({ ...s, [item.key]: !s[item.key] }))
              }
              className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                settings[item.key] ? "bg-amber-500" : "bg-zinc-700"
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

      <div className="flex justify-end pt-8">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-amber-600 text-white hover:bg-amber-500"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
