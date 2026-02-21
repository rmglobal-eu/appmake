"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { User, Save, Trash2, AlertTriangle } from "lucide-react";

interface AccountData {
  name: string;
  email: string;
  avatar: string;
}

export default function AccountSettings() {
  const [account, setAccount] = useState<AccountData>({
    name: "",
    email: "",
    avatar: "",
  });
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.account) {
            setAccount((prev) => ({ ...prev, ...data.account }));
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

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: { name: account.name, avatar: account.avatar },
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwords.new.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: {
            current: passwords.current,
            new: passwords.new,
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to change password");
      }
      toast.success("Password changed successfully");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to change password"
      );
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return;

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteAccount: true }),
      });
      if (!res.ok) throw new Error("Failed to delete account");
      toast.success("Account deleted");
      window.location.href = "/";
    } catch {
      toast.error("Failed to delete account");
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <User className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Account</h1>
            <p className="text-sm text-zinc-500">
              Manage your account information
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {/* Profile Section */}
        <section className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Profile
          </h2>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/[0.06]">
              {account.avatar ? (
                <img
                  src={account.avatar}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-zinc-600" />
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-zinc-300">
                Avatar URL
              </label>
              <input
                type="url"
                value={account.avatar}
                onChange={(e) =>
                  setAccount((a) => ({ ...a, avatar: e.target.value }))
                }
                placeholder="https://example.com/avatar.jpg"
                className="mt-1 w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Name
            </label>
            <input
              type="text"
              value={account.name}
              onChange={(e) =>
                setAccount((a) => ({ ...a, name: e.target.value }))
              }
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Email
            </label>
            <input
              type="email"
              value={account.email}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-2.5 text-sm text-zinc-500 outline-none"
            />
            <p className="text-xs text-zinc-600">
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-500"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-white/[0.06]" />

        {/* Change Password */}
        <section className="space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Change Password
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Current Password
              </label>
              <input
                type="password"
                value={passwords.current}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, current: e.target.value }))
                }
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                New Password
              </label>
              <input
                type="password"
                value={passwords.new}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, new: e.target.value }))
                }
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords((p) => ({ ...p, confirm: e.target.value }))
                }
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleChangePassword}
              disabled={
                changingPassword ||
                !passwords.current ||
                !passwords.new ||
                !passwords.confirm
              }
              variant="outline"
              className="gap-2 border-white/[0.06] text-zinc-300 hover:bg-white/[0.04] hover:text-white"
            >
              {changingPassword ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-white/[0.06]" />

        {/* Danger Zone */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-red-400/80">
            Danger Zone
          </h2>

          <div className="rounded-lg border border-red-500/20 bg-red-500/[0.03] p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-300">
                    Delete Account
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Permanently delete your account and all associated data.
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="shrink-0 gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent className="border-white/[0.06] bg-[#0f0f14] text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      Delete Account
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      This will permanently delete your account, all projects,
                      and all data. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-2 py-4">
                    <label className="block text-sm font-medium text-zinc-300">
                      Type{" "}
                      <span className="font-mono text-red-400">DELETE</span> to
                      confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder="DELETE"
                      className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeleteOpen(false);
                        setDeleteConfirm("");
                      }}
                      className="border-white/[0.06] text-zinc-300 hover:bg-white/[0.04]"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirm !== "DELETE"}
                      className="bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      Permanently Delete Account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
