"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Home,
  Search,
  Clock,
  LayoutGrid,
  Star,
  Users,
  Compass,
  LayoutTemplate,
  Sparkles,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
  PanelLeft,
  User,
  Moon,
  HelpCircle,
  FileText,
  Globe,
  Zap,
  Link2,
  Copy,
  Check,
  UserPlus,
  Plus,
  BarChart3,
  CreditCard,
  Users2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Project {
  id: string;
  name: string;
  updatedAt?: string;
}

interface DashboardSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  projects: Project[];
  isOpen: boolean;
  onClose: () => void;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
  right,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
        active
          ? "bg-white/10 text-white"
          : "text-white/60 hover:bg-white/5 hover:text-white/80"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
      {right && <span className="ml-auto">{right}</span>}
    </button>
  );
}

export function DashboardSidebar({ user, projects, isOpen, onClose }: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const firstName = user.name?.split(" ")[0] || "User";
  const recentProjects = projects.slice(0, 5);
  const [recentOpen, setRecentOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const referralLink = `https://appmake.io/invite/${firstName.toLowerCase()}`;

  function handleCopy() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const sidebarContent = (
    <div className="flex h-full w-[270px] flex-col bg-[#0f0f14] text-white">
      {/* Logo + panel toggle */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <img src="/logo-dark.svg" alt="AppMake" className="h-7" />
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 hover:bg-white/5 hover:text-white/60 md:block"
        >
          <PanelLeft className="h-4 w-4 md:block" />
          <X className="h-4 w-4 md:hidden" />
        </button>
      </div>

      {/* Workspace selector */}
      <div className="px-3 py-1">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2 text-[13px] font-medium outline-none transition-colors hover:bg-white/10">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-violet-600 text-[10px] font-bold text-white">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <span className="truncate">{firstName}&apos;s AppMake</span>
            <ChevronDown className="ml-auto h-3.5 w-3.5 text-white/40" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={4} className="w-72 border-white/10 bg-[#1e1e22] p-0 text-white">
            {/* Workspace header */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-base font-bold text-white">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{firstName}&apos;s AppMake</p>
                  <p className="text-xs text-white/40">{t("freePlan")} &bull; {t("member")}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-3 flex gap-2">
                <button onClick={() => { router.push("/settings?tab=workspace"); onClose(); }} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/15">
                  <Settings className="h-3.5 w-3.5" />
                  {tCommon("settings")}
                </button>
                <button className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/15">
                  <UserPlus className="h-3.5 w-3.5" />
                  {t("inviteMembers")}
                </button>
              </div>
            </div>

            {/* Turn Pro */}
            <div className="mx-4 flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium">{t("turnPro")}</span>
              </div>
              <button className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-500">
                {tCommon("upgrade")}
              </button>
            </div>

            {/* Credits */}
            <div className="mx-4 mt-2 rounded-xl bg-white/5 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t("credits")}</span>
                <span className="text-sm text-white/50">{t("creditsLeft")} &rsaquo;</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[80%] rounded-full bg-violet-500" />
              </div>
              <p className="mt-1.5 text-[11px] text-white/30">{t("dailyCreditsReset")}</p>
            </div>

            {/* All workspaces */}
            <div className="mt-3 border-t border-white/10 px-4 pt-3 pb-2">
              <p className="mb-2 text-[11px] font-medium text-white/30">{t("allWorkspaces")}</p>
              <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-[10px] font-bold text-white">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <span className="flex-1 text-sm font-medium">{firstName}&apos;s AppMake</span>
                <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/40">FREE</span>
                <Check className="h-4 w-4 text-white/50" />
              </div>
            </div>

            {/* Create new workspace */}
            <div className="border-t border-white/10 px-4 py-3">
              <button className="flex items-center gap-3 text-sm text-white/50 transition-colors hover:text-white/70">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">
                  <Plus className="h-4 w-4" />
                </div>
                {t("createNewWorkspace")}
              </button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-3">
        {/* Home + Search */}
        <div className="space-y-0.5">
          <NavItem
            icon={Home}
            label={t("home")}
            active={pathname === "/dashboard"}
            onClick={() => { router.push("/dashboard"); onClose(); }}
          />
          <NavItem icon={Search} label={t("search")} onClick={() => { setSearchQuery(""); setSearchOpen(true); }} />
        </div>

        {/* Projects section */}
        <div className="mt-5">
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">
            {t("projects")}
          </p>

          {/* Recent (collapsible) */}
          <button
            onClick={() => setRecentOpen(!recentOpen)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white/80"
          >
            <Clock className="h-4 w-4 shrink-0" />
            <span>{t("recent")}</span>
            <ChevronRight
              className={`ml-auto h-3.5 w-3.5 text-white/30 transition-transform ${recentOpen ? "rotate-90" : ""}`}
            />
          </button>

          {recentOpen && recentProjects.length > 0 && (
            <div className="ml-5 border-l border-white/10 py-0.5">
              {recentProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { router.push(`/chat/${p.id}`); onClose(); }}
                  className="flex w-full items-center rounded-r-lg py-1.5 pl-4 pr-3 text-[13px] text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
                >
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-0.5 space-y-0.5">
            <NavItem
              icon={LayoutGrid}
              label={t("allProjects")}
              active={pathname === "/projects"}
              onClick={() => { router.push("/projects"); onClose(); }}
            />
            <NavItem
              icon={Star}
              label={t("starred")}
              active={pathname === "/starred"}
              onClick={() => { router.push("/starred"); onClose(); }}
            />
            <NavItem
              icon={Users}
              label={t("sharedWithMe")}
              active={pathname === "/shared"}
              onClick={() => { router.push("/shared"); onClose(); }}
            />
          </div>
        </div>

        {/* Resources section */}
        <div className="mt-5">
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">
            {t("resources")}
          </p>
          <NavItem
            icon={Compass}
            label={t("discover")}
            active={pathname === "/discover"}
            onClick={() => { router.push("/discover"); onClose(); }}
          />
          <NavItem
            icon={LayoutTemplate}
            label={t("templates")}
            active={pathname === "/templates"}
            onClick={() => { router.push("/templates"); onClose(); }}
          />
          <NavItem
            icon={Sparkles}
            label={t("designSystem")}
            active={pathname === "/design-system"}
            onClick={() => { router.push("/design-system"); onClose(); }}
            right={
              <span className="rounded-full bg-yellow-500/15 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
                {t("staging")}
              </span>
            }
          />
          <NavItem
            icon={Users2}
            label={t("community")}
            active={pathname === "/community"}
            onClick={() => { router.push("/community"); onClose(); }}
          />
        </div>

        {/* Analytics & Account section */}
        <div className="mt-5">
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">
            {t("account")}
          </p>
          <NavItem
            icon={BarChart3}
            label={t("analytics")}
            active={pathname === "/analytics"}
            onClick={() => { router.push("/analytics"); onClose(); }}
          />
          <NavItem
            icon={CreditCard}
            label={t("billing")}
            active={pathname === "/billing"}
            onClick={() => { router.push("/billing"); onClose(); }}
          />
          <NavItem
            icon={Settings}
            label={tCommon("settings")}
            active={pathname?.startsWith("/settings")}
            onClick={() => { router.push("/settings"); onClose(); }}
          />
        </div>
      </div>

      {/* Bottom section */}
      <div className="space-y-2 p-3">
        {/* Share card */}
        <button
          onClick={() => setShareOpen(true)}
          className="w-full rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-left transition-colors hover:border-white/10 hover:bg-white/[0.06]"
        >
          <p className="text-[13px] font-medium text-white">{t("shareAppMake")}</p>
          <p className="text-[11px] text-white/40">{t("creditsPerPaidReferral")}</p>
        </button>

        {/* Upgrade card */}
        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
          <div>
            <p className="text-[13px] font-medium text-white">{t("upgradeToPro")}</p>
            <p className="text-[11px] text-white/40">{t("unlockMoreBenefits")}</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* User row */}
        <div className="flex items-center justify-between pt-1">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback className="bg-orange-600 text-xs text-white">
                  {firstName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { router.push("/settings?tab=account"); onClose(); }}>
                <User className="mr-2 h-4 w-4" />
                {tCommon("profile")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { router.push("/settings?tab=workspace"); onClose(); }}>
                <Settings className="mr-2 h-4 w-4" />
                {tCommon("settings")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Moon className="mr-2 h-4 w-4" />
                {t("appearance")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                {t("support")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                {t("documentation")}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Globe className="mr-2 h-4 w-4" />
                {t("homepage")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                {tNav("signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-full shrink-0 md:block">{sidebarContent}</aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <div className="absolute inset-y-0 left-0 animate-[slideIn_200ms_ease-out] [animation-fill-mode:forwards]">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Share / Referral Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-sm border-white/10 bg-[#18181b] p-0 text-white shadow-2xl"
        >
          {/* Header badge + close */}
          <div className="flex items-center justify-between px-6 pt-5">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
              {t("earn100Credits")}
            </span>
            <button
              onClick={() => setShareOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Hero */}
          <div className="px-6 pt-2 pb-1">
            <div className="flex items-center gap-3">
              <div>
                <DialogTitle className="text-2xl font-bold text-white">
                  {t("spreadTheLove")}
                </DialogTitle>
                <p className="mt-0.5 text-sm text-white/40">{t("earnFreeCredits")}</p>
              </div>
              <div className="ml-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-orange-400 to-yellow-300">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="space-y-3 px-6 pt-3">
            <p className="text-xs font-medium text-white/50">{t("howItWorks")}</p>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10">
                <Sparkles className="h-3 w-3 text-white/60" />
              </div>
              <p className="text-sm text-white/70">{t("shareInviteLink")}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10">
                <Users className="h-3 w-3 text-white/60" />
              </div>
              <p className="text-sm text-white/70">
                {t("theySignUpAndGet")} <span className="font-semibold text-white">{t("extra10Credits")}</span>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10">
                <Zap className="h-3 w-3 text-white/60" />
              </div>
              <p className="text-sm text-white/70">
                {t("youGet")} <span className="font-semibold text-white">{t("creditsOnce")}</span>
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="px-6 pt-4">
            <p className="text-xs text-white/30">{t("signedUpConverted")}</p>
          </div>

          {/* Copy link */}
          <div className="px-6 pt-3 pb-4">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 py-2 pr-2 pl-3">
              <Link2 className="h-4 w-4 shrink-0 text-white/30" />
              <span className="min-w-0 flex-1 truncate text-xs text-white/50">
                {referralLink}
              </span>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black transition-colors hover:bg-white/90"
              >
                {copied ? (
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" /> {tCommon("copied")}
                  </span>
                ) : (
                  t("copyLink")
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/5 px-6 py-3">
            <button className="text-xs text-white/30 transition-colors hover:text-white/50">
              {t("viewTermsAndConditions")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-2xl border-white/10 bg-[#1c1c20] p-0 text-white shadow-2xl"
        >
          <DialogTitle className="sr-only">{t("search")} {t("projects").toLowerCase()}</DialogTitle>

          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
            <Search className="h-5 w-5 shrink-0 text-white/30" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search") + " " + t("projects").toLowerCase()}
              className="flex-1 bg-transparent text-lg text-white placeholder-white/30 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="flex h-6 w-6 items-center justify-center rounded-full text-white/30 hover:bg-white/10 hover:text-white/60"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto px-3 py-2">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-white/30">
              {t("recent")} {t("projects")}
            </p>
            {projects
              .filter((p) =>
                searchQuery
                  ? p.name.toLowerCase().includes(searchQuery.toLowerCase())
                  : true
              )
              .slice(0, 10)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    router.push(`/chat/${p.id}`);
                    setSearchOpen(false);
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/5"
                >
                  <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-white/5">
                    <div className="flex h-full w-full items-center justify-center">
                      <LayoutGrid className="h-4 w-4 text-white/20" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-medium text-white">{p.name}</p>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[8px] font-bold text-white">
                        {firstName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-white/40">{user.name || firstName}</span>
                    </div>
                  </div>
                  {p.updatedAt && (
                    <span className="shrink-0 text-xs text-white/30">
                      {timeAgo(p.updatedAt)}
                    </span>
                  )}
                </button>
              ))}

            {projects.filter((p) =>
              searchQuery
                ? p.name.toLowerCase().includes(searchQuery.toLowerCase())
                : true
            ).length === 0 && (
              <p className="px-2 py-8 text-center text-sm text-white/30">
                {t("noProjectsFound")}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
