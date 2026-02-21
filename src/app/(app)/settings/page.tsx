"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Users,
  CreditCard,
  Cloud,
  Shield,
  User,
  FlaskConical,
  Link2,
  Github,
  FileText,
  Search,
  Download,
  UserPlus,
  MoreHorizontal,
  ArrowUpDown,
  Zap,
  ChevronRight,
  ExternalLink,
  Volume2,
  VolumeX,
  Trash2,
  Sparkles,
  Code2,
  Bell,
  KeyRound,
} from "lucide-react";
import AISettingsPanel from "@/components/settings/AISettings";
import EditorSettingsPanel from "@/components/settings/EditorSettings";
import NotificationSettingsPanel from "@/components/settings/NotificationSettings";
import APIKeySettingsPanel from "@/components/settings/APIKeySettings";

// ── Reusable helpers ─────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-0 divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03]">
      {children}
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="mt-1 text-sm text-white/40">{subtitle}</p>
      </div>
      <button className="flex items-center gap-1.5 text-sm text-white/40 transition-colors hover:text-white/60">
        <FileText className="h-4 w-4" />
        Docs
      </button>
    </div>
  );
}

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? "bg-violet-600" : "bg-white/15"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

function Badge({ label, color = "white" }: { label: string; color?: "white" | "yellow" | "violet" }) {
  const colors = {
    white: "bg-white/10 text-white/50",
    yellow: "bg-yellow-500/15 text-yellow-400",
    violet: "bg-violet-500/15 text-violet-400",
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${colors[color]}`}>
      {label}
    </span>
  );
}

// ── Sidebar nav items ────────────────────────────────────────────────

const WORKSPACE_ITEMS = [
  { id: "workspace", label: "Workspace", icon: null },
  { id: "people", label: "People", icon: Users },
  { id: "plans", label: "Plans & credits", icon: CreditCard },
  { id: "cloud", label: "Cloud & AI balance", icon: Cloud },
  { id: "privacy", label: "Privacy & security", icon: Shield },
] as const;

const ACCOUNT_ITEMS = [
  { id: "account", label: "", icon: User },
  { id: "labs", label: "Labs", icon: FlaskConical },
] as const;

const PREFERENCES_ITEMS = [
  { id: "ai-settings", label: "AI Settings", icon: Sparkles },
  { id: "editor-settings", label: "Editor", icon: Code2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "api-keys", label: "API Keys", icon: KeyRound },
] as const;

const CONNECTOR_ITEMS = [
  { id: "connectors", label: "Connectors", icon: Link2 },
  { id: "github", label: "GitHub", icon: Github },
] as const;

type TabId = string;

// ── 1. Workspace Settings ────────────────────────────────────────────

function WorkspaceSettings({ userName }: { userName: string }) {
  const initial = userName.charAt(0).toUpperCase();
  const [workspaceName, setWorkspaceName] = useState(`${userName}'s AppMake`);

  return (
    <div>
      <PageHeader title="Workspace settings" subtitle="Workspaces allow you to collaborate on projects in real time." />
      <div className="mt-8">
        <SectionCard>
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Avatar</h3>
              <p className="mt-0.5 text-sm text-white/40">Set an avatar for your workspace.</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-base font-bold text-white">
              {initial}
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white">Name</h3>
            <p className="mt-0.5 text-sm text-white/40">Your full workspace name, as visible to others.</p>
            <div className="mt-3">
              <input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value.slice(0, 50))}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white/20"
              />
              <p className="mt-1 text-right text-xs text-white/30">{workspaceName.length} / 50 characters</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Username</h3>
              <p className="mt-0.5 text-sm text-white/40">Set a username for the workspace profile page.</p>
            </div>
            <button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15">
              Set username
            </button>
          </div>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white">Default monthly member credit limit</h3>
            <p className="mt-0.5 text-sm text-white/40">
              The default monthly credit limit for members of this workspace. Leave empty to use no limit.
            </p>
            <div className="mt-3">
              <input
                placeholder="Enter default monthly member credit limit (optional)"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-white/20"
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Leave workspace</h3>
              <p className="mt-0.5 max-w-md text-sm text-white/40">
                You cannot leave your last workspace. Your account must be a member of at least one workspace.
              </p>
            </div>
            <button className="shrink-0 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20">
              Leave workspace
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ── 2. People ────────────────────────────────────────────────────────

function PeopleSettings({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [tab, setTab] = useState<"all" | "invitations" | "collaborators">("all");
  const tabs = ["All", "Invitations", "Collaborators"] as const;

  return (
    <div>
      <PageHeader title="People" subtitle={`Inviting people to ${userName}'s AppMake gives access to workspace shared projects and credits. You have 1 builder in this workspace.`} />

      <div className="mt-6">
        {/* Tabs + actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t.toLowerCase() as typeof tab)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  tab === t.toLowerCase() ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/5">
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/15">
              <UserPlus className="h-3.5 w-3.5" />
              Invite members
            </button>
          </div>
        </div>

        {/* Search + filter */}
        <div className="mt-4 flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <Search className="h-4 w-4 text-white/30" />
            <input placeholder="Search..." className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none" />
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/5">
            All roles
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Table */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-6 gap-4 border-b border-white/10 px-4 py-3 text-xs font-medium text-white/40">
            <span>Name</span>
            <span>Role</span>
            <span>Joined date</span>
            <span>Feb usage</span>
            <span>Total usage</span>
            <span>Credit limit</span>
          </div>
          {/* Row */}
          <div className="grid grid-cols-6 items-center gap-4 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{userName} <span className="text-white/30">(you)</span></p>
                <p className="text-[11px] text-white/30">{userEmail}</p>
              </div>
            </div>
            <span className="text-sm text-white/60">Owner</span>
            <span className="text-sm text-white/60">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            <span className="text-sm text-white/60">13 credits</span>
            <span className="text-sm text-white/60">14 credits</span>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/30">—</span>
              <button className="text-white/30 hover:text-white/60">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-white/30">Showing 1-1 of 1</p>
      </div>
    </div>
  );
}

// ── 3. Plans & Credits ───────────────────────────────────────────────

function PlansSettings() {
  return (
    <div>
      <PageHeader title="Plans & credits" subtitle="Manage your subscription plan and credit balance." />

      <div className="mt-8 grid grid-cols-2 gap-4">
        {/* Current plan */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">You&apos;re on Free Plan</p>
              <p className="text-xs text-white/40">Upgrade anytime</p>
            </div>
          </div>
          <button className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15">
            Manage
          </button>
        </div>

        {/* Credits remaining */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-white">Credits remaining</p>
            <p className="text-sm text-white/50">4.5 of 5</p>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[90%] rounded-full bg-green-500" />
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
              Daily credits used first
            </span>
          </div>
          <div className="mt-2 space-y-1 text-xs text-white/40">
            <p>No credits will rollover</p>
            <p>Daily credits reset at midnight UTC</p>
          </div>
        </div>
      </div>

      {/* Pricing tiers */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        {/* Pro */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-lg font-bold text-white">Pro</h3>
          <p className="mt-1 text-xs text-white/40">Designed for fast-moving teams building together in real time.</p>
          <p className="mt-4 text-2xl font-bold text-white">$25 <span className="text-sm font-normal text-white/40">per month</span></p>
          <p className="mt-1 text-xs text-white/30">shared across unlimited users</p>
          <button className="mt-4 w-full rounded-lg bg-white/10 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15">
            Upgrade
          </button>
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-white/50">All features in Free, plus:</p>
            {["100 monthly credits", "5 daily credits (up to 150/month)", "Usage-based Cloud + AI", "Credit rollovers", "On-demand credit top-ups"].map((f) => (
              <p key={f} className="flex items-center gap-2 text-xs text-white/40">
                <span className="text-green-400">✓</span> {f}
              </p>
            ))}
          </div>
        </div>

        {/* Business */}
        <div className="rounded-2xl border border-violet-500/30 bg-white/[0.03] p-5">
          <h3 className="text-lg font-bold text-white">Business</h3>
          <p className="mt-1 text-xs text-white/40">Advanced controls and power features for growing departments.</p>
          <p className="mt-4 text-2xl font-bold text-white">$50 <span className="text-sm font-normal text-white/40">per month</span></p>
          <p className="mt-1 text-xs text-white/30">shared across unlimited users</p>
          <button className="mt-4 w-full rounded-lg bg-violet-600 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500">
            Upgrade
          </button>
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-white/50">All features in Pro, plus:</p>
            {["100 monthly credits", "Internal publish", "SSO", "Team workspace", "Personal projects"].map((f) => (
              <p key={f} className="flex items-center gap-2 text-xs text-white/40">
                <span className="text-green-400">✓</span> {f}
              </p>
            ))}
          </div>
        </div>

        {/* Enterprise */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="text-lg font-bold text-white">Enterprise</h3>
          <p className="mt-1 text-xs text-white/40">Built for large orgs needing flexibility, scale, and governance.</p>
          <p className="mt-4 text-lg font-semibold text-white/50">Custom</p>
          <p className="mt-1 text-xs text-white/30">Flexible plans</p>
          <button className="mt-4 w-full rounded-lg border border-white/10 py-2 text-sm font-medium text-white/50 transition-colors hover:bg-white/5">
            Book a demo
          </button>
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-white/50">All features in Business, plus:</p>
            {["Dedicated support", "Onboarding services", "Design systems", "SCIM", "Publishing controls", "Sharing controls"].map((f) => (
              <p key={f} className="flex items-center gap-2 text-xs text-white/40">
                <span className="text-green-400">✓</span> {f}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 4. Cloud & AI Balance ────────────────────────────────────────────

function CloudSettings() {
  return (
    <div>
      <PageHeader title="Cloud & AI balance" subtitle="All plans include free monthly usage. For increased Cloud and AI usage, you can top up on paid plans." />

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500">
              <Cloud className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Cloud + AI</p>
              <p className="text-xs text-white/40">Monthly included usage resets 1 Mar 2026</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-white/40">Upgrade to top up your balance ($0).</p>
          <button className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15">
            Upgrade plan
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">Cloud</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">$0 / $25</p>
              <p className="text-xs text-white/30">Free balance used</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">AI</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">$0 / $1</p>
              <p className="text-xs text-white/30">Free balance used</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <SectionCard>
          <button className="flex w-full items-center justify-between p-5">
            <span className="text-sm font-semibold text-white">Project breakdown</span>
            <ChevronRight className="h-4 w-4 text-white/30" />
          </button>
        </SectionCard>
        <p className="mt-4 text-xs text-white/40">
          This is a temporary offering until the beginning of 2026 as we refine our pricing model. <span className="text-violet-400 underline">Read more</span>
        </p>
      </div>
    </div>
  );
}

// ── 5. Privacy & Security ────────────────────────────────────────────

function PrivacySettings() {
  const [projectVisibility, setProjectVisibility] = useState("workspace");
  const [mcpServers, setMcpServers] = useState(true);
  const [dataCollection, setDataCollection] = useState(false);
  const [restrictInvitations, setRestrictInvitations] = useState(false);
  const [publicPreview, setPublicPreview] = useState(true);
  const [crossProject, setCrossProject] = useState(true);

  return (
    <div>
      <PageHeader title="Privacy & security" subtitle="Manage privacy and security settings for your workspace." />
      <div className="mt-8">
        <SectionCard>
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Default project visibility</h3>
              <p className="mt-0.5 text-sm text-white/40">Choose whether new projects start as public, private (workspace-only), or drafts.</p>
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/60">
              Workspace
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Default website access <Badge label="Business" color="violet" />
              </h3>
              <p className="mt-0.5 text-sm text-white/40">Choose if new published websites are public or only accessible to logged in workspace members.</p>
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/60">
              Anyone
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-sm font-semibold text-white">
                MCP servers access <Badge label="Business" color="violet" />
              </h3>
              <p className="mt-0.5 text-sm text-white/40">Allow workspace members to use MCP servers.</p>
            </div>
            <ToggleSwitch enabled={mcpServers} onToggle={() => setMcpServers(!mcpServers)} />
          </div>
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Data collection opt out <Badge label="Business" color="violet" />
              </h3>
              <p className="mt-0.5 text-sm text-white/40">Opt out of data collection for this workspace.</p>
            </div>
            <ToggleSwitch enabled={dataCollection} onToggle={() => setDataCollection(!dataCollection)} />
          </div>
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Restrict workspace invitations <Badge label="Enterprise" color="yellow" />
              </h3>
              <p className="mt-0.5 text-sm text-white/40">When enabled, only admins and owners can invite members to this workspace.</p>
            </div>
            <ToggleSwitch enabled={restrictInvitations} onToggle={() => setRestrictInvitations(!restrictInvitations)} />
          </div>
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Who can publish externally <Badge label="Enterprise" color="yellow" />
              </h3>
              <p className="mt-0.5 text-sm text-white/40">Control who can publish and deploy projects to the web.</p>
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/60">
              Editors and above
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Allow public preview links sharing <Badge label="Enterprise" color="yellow" />
              </h3>
              <p className="mt-0.5 text-sm text-white/40">When enabled, users can create temporary public preview links to their apps. When disabled, preview link creation is blocked.</p>
            </div>
            <ToggleSwitch enabled={publicPreview} onToggle={() => setPublicPreview(!publicPreview)} />
          </div>
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Cross-project sharing</h3>
              <p className="mt-0.5 text-sm text-white/40">Allow projects in this workspace to read files from other projects.</p>
            </div>
            <ToggleSwitch enabled={crossProject} onToggle={() => setCrossProject(!crossProject)} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ── 6. Account Settings ──────────────────────────────────────────────

function AccountSettings({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [chatSuggestions, setChatSuggestions] = useState(true);
  const [autoAccept, setAutoAccept] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [soundMode, setSoundMode] = useState<"first" | "always" | "never">("first");
  const [username, setUsername] = useState(userName.toLowerCase().replace(/\s/g, "_"));

  return (
    <div>
      <PageHeader title="Account settings" subtitle={`Personalize how others see and interact with you on AppMake.`} />

      <div className="mt-8">
        <SectionCard>
          {/* Profile */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white">Profile</h3>
            <p className="mt-0.5 text-sm text-white/40">Change name, location, avatar, and banner on your profile.</p>
            <button className="mt-2 flex items-center gap-1 text-sm text-violet-400 transition-colors hover:text-violet-300">
              Open profile on appmake.io/{username}
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Username */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white">Username</h3>
            <p className="mt-0.5 text-sm text-white/40">Your public identifier and profile URL.</p>
            <div className="mt-3 flex gap-2">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white/20"
              />
              <button className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15">
                Update
              </button>
            </div>
          </div>
          {/* Email */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white">Email</h3>
            <p className="mt-0.5 text-sm text-white/40">Your email address associated with your account.</p>
            <div className="mt-3">
              <input
                value={userEmail}
                disabled
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50 outline-none"
              />
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard>
          {/* Chat suggestions */}
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Chat suggestions</h3>
              <p className="mt-0.5 text-sm text-white/40">Show helpful suggestions in the chat interface to enhance your experience.</p>
            </div>
            <ToggleSwitch enabled={chatSuggestions} onToggle={() => setChatSuggestions(!chatSuggestions)} />
          </div>
          {/* Generation complete sound */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white">Generation complete sound</h3>
            <p className="mt-0.5 text-sm text-white/40">Plays a satisfying sound notification when a generation is finished.</p>
            <div className="mt-3 space-y-2">
              {([["first", "First generation", Volume2], ["always", "Always", Volume2], ["never", "Never", VolumeX]] as const).map(([val, label, Icon]) => (
                <label key={val} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="sound"
                    checked={soundMode === val}
                    onChange={() => setSoundMode(val)}
                    className="h-4 w-4 accent-violet-500"
                  />
                  <Icon className="h-4 w-4 text-white/40" />
                  <span className="text-sm text-white/60">{label}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Auto-accept invitations */}
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Auto-accept invitations</h3>
              <p className="mt-0.5 text-sm text-white/40">Automatically join workspaces and projects when invited instead of requiring manual acceptance.</p>
            </div>
            <ToggleSwitch enabled={autoAccept} onToggle={() => setAutoAccept(!autoAccept)} />
          </div>
          {/* Push notifications */}
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Push notifications</h3>
              <p className="mt-0.5 text-sm text-white/40">Enable push notifications in the mobile app to customize these settings.</p>
            </div>
            <ToggleSwitch enabled={pushNotifications} onToggle={() => setPushNotifications(!pushNotifications)} />
          </div>
        </SectionCard>
      </div>

      {/* Linked accounts */}
      <div className="mt-6">
        <SectionCard>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white">Linked accounts</h3>
            <p className="mt-0.5 text-sm text-white/40">Manage accounts linked for sign-in.</p>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <span className="text-sm">G</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Google <Badge label="Primary" color="violet" /></p>
                  <p className="text-xs text-white/40">{userEmail}</p>
                </div>
              </div>
            </div>
          </div>
          {/* Two-factor auth */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white">Two-factor authentication</h3>
            <p className="mt-0.5 text-sm text-white/40">Secure your account with a one-time code via an authenticator app or SMS.</p>
          </div>
          {/* Delete account */}
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Delete account</h3>
              <p className="mt-0.5 text-sm text-white/40">Permanently delete your AppMake account. This cannot be undone.</p>
            </div>
            <button className="flex shrink-0 items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20">
              <Trash2 className="h-4 w-4" />
              Delete account
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ── 7. Labs ──────────────────────────────────────────────────────────

function LabsSettings() {
  const [gitBranch, setGitBranch] = useState(false);

  return (
    <div>
      <PageHeader title="Labs" subtitle="These are experimental features, that might be modified or removed." />
      <div className="mt-8">
        <SectionCard>
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-sm font-semibold text-white">GitHub branch switching</h3>
              <p className="mt-0.5 text-sm text-white/40">Select the branch to make edits to in your GitHub repository.</p>
            </div>
            <ToggleSwitch enabled={gitBranch} onToggle={() => setGitBranch(!gitBranch)} />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ── 8. Connectors ────────────────────────────────────────────────────

function ConnectorLogo({ name }: { name: string }) {
  const logos: Record<string, { bg: string; icon: React.ReactNode }> = {
    Cloud: {
      bg: "#6366f1",
      icon: <Cloud className="h-5 w-5 text-white" />,
    },
    AI: {
      bg: "#0f0f0f",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
          <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
        </svg>
      ),
    },
    Shopify: {
      bg: "#96BF48",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
          <path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.125-.194-.21-.194s-1.733-.124-1.733-.124-1.148-1.137-1.275-1.264c-.04-.04-.085-.06-.131-.076L15.337 24v-.021zm-2.019-18.552c-.044-.007-.09-.012-.132-.012-.047 0-.181.047-.181.047s-.32.1-.789.256c-.47-1.355-1.3-2.601-2.759-2.601h-.128C8.905 2.585 8.376 2 7.748 2 4.623 2 3.109 5.886 2.6 7.87c-1.327.413-2.271.703-2.386.741-.745.232-.768.256-.865.96C-.737 10.236 0 24 0 24l12.14 2.09-.017-.017c-.036.004-.036-.006-.036-.006l1.231-20.64zm-4.513-.86v.174s-1.302.405-2.727.856c.527-2.026 1.51-3.006 2.366-3.382.193.528.347 1.228.361 2.352zm-1.633-3.27c.152 0 .3.047.44.152-1.13.532-2.34 1.874-2.85 4.556l-2.158.67C3.252 5.165 4.629 1.296 7.172 1.296z" />
        </svg>
      ),
    },
    Stripe: {
      bg: "#635BFF",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
          <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
        </svg>
      ),
    },
    ElevenLabs: {
      bg: "#1a1a1a",
      icon: <span className="text-[13px] font-black tracking-tight text-white">XI</span>,
    },
    Firecrawl: {
      bg: "#FF6F00",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
          <path d="M12 23c-1.09 0-1.98-.88-1.98-1.97 0-.55.45-1.97 1.98-4.48 1.53 2.51 1.98 3.93 1.98 4.48 0 1.09-.89 1.97-1.98 1.97zm5.57-8.94c0 3.14-2.49 5.69-5.57 5.69S6.43 17.2 6.43 14.06c0-1.58.64-3.15 1.95-4.81l.43-.55.56.39c.56.39 1.17.74 1.83 1.03.29.13.63.02.76-.27a.6.6 0 0 0-.15-.72 11.77 11.77 0 0 1-2.32-2.7c-.76-1.2-1.28-2.48-1.55-3.82-.12-.6-.18-1.21-.18-1.82V.5l.44.13c2.02.59 3.75 1.7 5.13 3.28 1.2 1.38 2.02 2.97 2.42 4.72.24 1.04.36 2.12.36 3.2v.11c.28-.09.55-.19.81-.3l.56-.25.35.51c.66.97 1.17 2 1.17 3.16z" />
        </svg>
      ),
    },
    Perplexity: {
      bg: "#20B8CD",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
          <path d="M12 1L5 5.5V10H3v8h2v1.5L12 23l7-3.5V18h2v-8h-2V5.5L12 1zm5 16.5l-5 2.5-5-2.5V18h2v-4H7V7l5-3 5 3v7h-2v4h2v.5z" />
        </svg>
      ),
    },
    Slack: {
      bg: "#4A154B",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A" />
          <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0" />
          <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D" />
          <path d="M15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z" fill="#ECB22E" />
        </svg>
      ),
    },
    Supabase: {
      bg: "#1c1c1c",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path d="M13.7 21.8c-.4.5-1.3.2-1.3-.5v-8.1h8.6c.8 0 1.3.9.7 1.5l-8 7.1z" fill="#3FCF8E" />
          <path d="M13.7 21.8c-.4.5-1.3.2-1.3-.5v-8.1h8.6c.8 0 1.3.9.7 1.5l-8 7.1z" fill="url(#a)" fillOpacity=".2" />
          <path d="M10.3 2.2c.4-.5 1.3-.2 1.3.5v8.1H3c-.8 0-1.3-.9-.7-1.5l8-7.1z" fill="#3FCF8E" />
          <defs>
            <linearGradient id="a" x1="12.4" y1="15.1" x2="18.8" y2="18.8" gradientUnits="userSpaceOnUse">
              <stop stopColor="#249361" />
              <stop offset="1" stopColor="#3FCF8E" />
            </linearGradient>
          </defs>
        </svg>
      ),
    },
    Amplitude: {
      bg: "#1B1F3B",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
          <path d="M12 2L2 19.5h20L12 2zm0 4l6.9 12H5.1L12 6z" />
        </svg>
      ),
    },
    Atlassian: {
      bg: "#0052CC",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
          <path d="M7.12 11.084a.683.683 0 0 0-1.16.126L.678 22.2a.683.683 0 0 0 .609.99h7.418a.68.68 0 0 0 .609-.378c1.726-3.53.473-8.86-2.194-11.728zM11.537 1.2a14.1 14.1 0 0 0-.964 13.96l3.416 6.84a.683.683 0 0 0 .609.378h7.418a.683.683 0 0 0 .609-.99S13.452 2.2 13.078 1.504a.68.68 0 0 0-1.162-.126l-.379.422z" />
        </svg>
      ),
    },
    Granola: {
      bg: "#E8C547",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
        </svg>
      ),
    },
    Linear: {
      bg: "#5E6AD2",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
          <path d="M1.04 11.17c-.05.3-.09.61-.12.92L10.91 22.08c.31-.03.62-.07.92-.12L1.04 11.17zm-.78 3.42a11.94 11.94 0 0 0 .6 2.14L9.27 23.14c.7.3 1.42.5 2.14.6L.26 14.59zm1.64 4.32a12.06 12.06 0 0 0 1.59 2.05 12.06 12.06 0 0 0 2.05 1.59l5.41-5.41a3.94 3.94 0 0 1-3.64-3.64L1.9 18.91zM12 0C5.37 0 0 5.37 0 12c0 .96.11 1.89.33 2.79L13.79.33C12.89.11 11.96 0 12 0zm6.59 1.94A11.94 11.94 0 0 0 12.53.08l-11 11c.07 2.18.74 4.2 1.86 5.93L14.5 5.9a3.94 3.94 0 0 1 3.61 3.61L6.99 20.62a11.94 11.94 0 0 0 5.93 1.86l11-11a11.94 11.94 0 0 0-1.86-5.93L18.59 9.02A3.94 3.94 0 0 1 15 12.63l-3.5 3.5 7.02-7.02a12.06 12.06 0 0 0-.93-7.17z" />
        </svg>
      ),
    },
    GitHub: {
      bg: "#24292e",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
    },
  };

  const logo = logos[name];
  if (!logo) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-white/20 text-white/30">
        <Link2 className="h-4 w-4" />
      </div>
    );
  }

  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-xl"
      style={{ backgroundColor: logo.bg }}
    >
      {logo.icon}
    </div>
  );
}

const SHARED_CONNECTORS = [
  { name: "Cloud", desc: "Built-in backend, ready to use", enabled: true },
  { name: "AI", desc: "Unlock powerful AI features", enabled: true },
  { name: "Shopify", desc: "Build an eCommerce store", enabled: true },
  { name: "Stripe", desc: "Set up payments", enabled: true },
  { name: "ElevenLabs", desc: "AI voice generation, text-to-speech", enabled: false },
  { name: "Firecrawl", desc: "AI-powered scraper, search and retrieval", enabled: false },
  { name: "Perplexity", desc: "AI-powered search and answer engine", enabled: false },
  { name: "Slack", desc: "Send messages and interact with Slack", enabled: false },
  { name: "Supabase", desc: "Connect your own Supabase project", enabled: false },
];

const PERSONAL_CONNECTORS = [
  { name: "Amplitude", desc: "Access your product analytics and feedback" },
  { name: "Atlassian", desc: "Access your Jira issues and Confluence pages" },
  { name: "Granola", desc: "Access your meeting notes and transcripts" },
  { name: "Linear", desc: "Access your Linear issues and project data" },
  { name: "GitHub", desc: "Connect your GitHub account" },
  { name: "New MCP server", desc: "Add custom MCP server" },
];

function ConnectorsSettings() {
  return (
    <div>
      <PageHeader title="Connectors" subtitle="Extend your apps with powerful integrations and services." />

      <div className="mt-6">
        <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5">
          <Search className="h-4 w-4 text-white/25" />
          <input placeholder="Search connectors..." className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none" />
        </div>
      </div>

      {/* Shared connectors */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-white">Shared connectors</h3>
            <p className="mt-1 text-[13px] text-white/35">Add functionality to your apps. Configured once by admins, available to everyone in your workspace.</p>
          </div>
          <button className="flex items-center gap-1 text-[13px] font-medium text-white/35 transition-colors hover:text-white/60">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {SHARED_CONNECTORS.map((c) => (
            <div
              key={c.name}
              className="group cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between">
                <ConnectorLogo name={c.name} />
                {c.enabled && (
                  <span className="rounded-full bg-green-500/10 px-2.5 py-0.5 text-[11px] font-medium text-green-400">
                    Enabled
                  </span>
                )}
              </div>
              <h4 className="mt-4 text-[14px] font-semibold text-white">{c.name}</h4>
              <p className="mt-1 text-[12px] leading-relaxed text-white/35">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Personal connectors */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-white">Personal connectors</h3>
            <p className="mt-1 text-[13px] text-white/35">Add connectors that add context while you build. <span className="cursor-pointer text-violet-400 transition-colors hover:text-violet-300">Read more</span></p>
          </div>
          <button className="flex items-center gap-1 text-[13px] font-medium text-white/35 transition-colors hover:text-white/60">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {PERSONAL_CONNECTORS.map((c) => (
            <div
              key={c.name}
              className="group cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.06]"
            >
              <ConnectorLogo name={c.name} />
              <h4 className="mt-4 text-[14px] font-semibold text-white">{c.name}</h4>
              <p className="mt-1 text-[12px] leading-relaxed text-white/35">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Missing integration */}
      <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-white">Missing an integration?</h3>
            <p className="mt-1 text-[13px] text-white/35">Request new integrations or support the ones you care about.</p>
          </div>
          <button className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/15">
            Request
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 9. GitHub ────────────────────────────────────────────────────────

function GitHubSettings() {
  return (
    <div>
      <PageHeader title="GitHub" subtitle="Sync your project 2-way with GitHub to collaborate at source." />
      <div className="mt-8">
        <SectionCard>
          <div className="flex items-center justify-between p-6">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Connected account <Badge label="Admin" color="yellow" />
              </h3>
              <p className="mt-0.5 text-sm text-white/40">Add your GitHub account to manage connected organizations.</p>
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5">
              <Github className="h-4 w-4" />
              Connect GitHub
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>(searchParams.get("tab") || "workspace");

  if (!session) return null;

  const userName = session.user?.name?.split(" ")[0] || "User";
  const fullName = session.user?.name || "User";
  const userEmail = session.user?.email || "";

  function renderTab() {
    switch (activeTab) {
      case "workspace": return <WorkspaceSettings userName={userName} />;
      case "people": return <PeopleSettings userName={fullName} userEmail={userEmail} />;
      case "plans": return <PlansSettings />;
      case "cloud": return <CloudSettings />;
      case "privacy": return <PrivacySettings />;
      case "account": return <AccountSettings userName={fullName} userEmail={userEmail} />;
      case "labs": return <LabsSettings />;
      case "ai-settings": return <AISettingsPanel />;
      case "editor-settings": return <EditorSettingsPanel />;
      case "notifications": return <NotificationSettingsPanel />;
      case "api-keys": return <APIKeySettingsPanel />;
      case "connectors": return <ConnectorsSettings />;
      case "github": return <GitHubSettings />;
      default: return <WorkspaceSettings userName={userName} />;
    }
  }

  return (
    <div className="flex h-screen bg-[#0f0f14]">
      {/* Settings sidebar */}
      <div className="flex w-[240px] shrink-0 flex-col border-r border-white/10 bg-[#0f0f14]">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 px-4 pt-5 pb-4 text-sm text-white/50 transition-colors hover:text-white/70"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>

        <div className="flex-1 overflow-y-auto px-3">
          <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">Workspace</p>
          {WORKSPACE_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                activeTab === item.id ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white/70"
              }`}
            >
              {item.id === "workspace" ? (
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-violet-600 text-[8px] font-bold text-white">
                  {userName.charAt(0).toUpperCase()}
                </div>
              ) : item.icon ? (
                <item.icon className="h-4 w-4 shrink-0" />
              ) : null}
              <span>{item.id === "workspace" ? `${userName}'s AppMake` : item.label}</span>
            </button>
          ))}

          <p className="mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">Account</p>
          {ACCOUNT_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                activeTab === item.id ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white/70"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.id === "account" ? fullName : item.label}</span>
            </button>
          ))}

          <p className="mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">Preferences</p>
          {PREFERENCES_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                activeTab === item.id ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white/70"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}

          <p className="mb-1 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">Connectors</p>
          {CONNECTOR_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                activeTab === item.id ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/5 hover:text-white/70"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-[#141418] px-[200px] py-10">
        <div>
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
