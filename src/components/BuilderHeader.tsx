"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Eye,
  Pencil,
  Code2,
  MoreHorizontal,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  Maximize2,
  Share2,
  Settings,
  Rocket,
  ChevronDown,
  FolderOpen,
  LogOut,
  History,
  Copy,
  LayoutGrid,
  GitBranch,
  Database,
  Figma,
  Search,
  Gauge,
  Globe,
  Users,
} from "lucide-react";
import {
  useBuilderStore,
  type ViewMode,
  type DeviceViewport,
  type PreviewMode,
} from "@/lib/stores/builder-store";

interface BuilderHeaderProps {
  onRefresh?: () => void;
  onShare?: () => void;
  onPublish?: () => void;
  onGit?: () => void;
  onSupabase?: () => void;
  onFigma?: () => void;
  onDomain?: () => void;
  onReview?: () => void;
  onAudit?: () => void;
  onExport?: () => void;
  onCollab?: () => void;
}

export function BuilderHeader({ onRefresh, onShare, onPublish, onGit, onSupabase, onFigma, onDomain, onReview, onAudit, onExport, onCollab }: BuilderHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    viewMode,
    deviceViewport,
    projectName,
    urlPath,
    previewMode,
    setViewMode,
    setDeviceViewport,
    setProjectName,
    setVersionHistoryOpen,
    setPreviewMode,
  } = useBuilderStore();

  const errorCount = 0;

  const comingSoon = () => toast("Coming soon!", { duration: 1500 });

  return (
    <TooltipProvider delayDuration={300}>
      <header className="flex h-11 shrink-0 items-center border-b border-white/10 bg-[#0f0f14]/80 px-2 gap-1 backdrop-blur-xl">
        {/* === Left: Logo + Project Name === */}
        <div className="flex items-center gap-1.5 mr-2">
          <button
            className="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-white/10"
            onClick={() => router.push("/dashboard")}
          >
            <Image
              src="/icon-dark.svg"
              alt="AppMake"
              width={22}
              height={22}
              className="hidden dark:block"
            />
            <Image
              src="/icon-light.svg"
              alt="AppMake"
              width={22}
              height={22}
              className="block dark:hidden"
            />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-white/90 hover:bg-white/10 max-w-[160px]">
                <span className="truncate">{projectName}</span>
                <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                <FolderOpen className="mr-2 h-4 w-4" />
                All Projects
              </DropdownMenuItem>
              <DropdownMenuItem onClick={comingSoon}>
                <Settings className="mr-2 h-4 w-4" />
                Project Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-[11px] text-white/30 hidden md:block">
            Previewing...
          </span>
        </div>

        {/* === Center-left: Placeholder icon buttons === */}
        <div className="hidden md:flex items-center gap-0.5 mr-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setVersionHistoryOpen(true)}>
                <History className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>History</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={comingSoon}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplicate</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={comingSoon}>
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Layout</TooltipContent>
          </Tooltip>
        </div>

        {/* === Center: View mode toggle pill === */}
        <div className="flex items-center rounded-lg border border-white/10 bg-white/5 p-0.5">
          <ViewToggleButton
            active={viewMode === "preview"}
            onClick={() => setViewMode("preview")}
            icon={<Eye className="h-3 w-3" />}
            label="Preview"
            badge={errorCount > 0 ? errorCount : undefined}
          />
          <ViewToggleButton
            active={viewMode === "visual-editor"}
            onClick={() => setViewMode("visual-editor")}
            icon={<Pencil className="h-3 w-3" />}
            label="Visual"
          />
          <ViewToggleButton
            active={viewMode === "code"}
            onClick={() => setViewMode("code")}
            icon={<Code2 className="h-3 w-3" />}
            label="Code"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex items-center rounded-md px-1.5 py-1 text-white/40 hover:text-white/70"
                onClick={comingSoon}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>More views</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1" />

        {/* === Center-right: Preview mode toggle + Device viewport + URL === */}
        {(viewMode === "preview" || viewMode === "visual-editor") && (
          <div className="hidden md:flex items-center gap-1 mr-2">
            {/* Quick Preview / Full Sandbox toggle */}
            <div className="flex items-center rounded-md border border-white/10 bg-white/5 p-0.5 mr-1">
              <button
                className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  previewMode === "quick"
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/50 hover:text-white/80"
                }`}
                onClick={() => setPreviewMode("quick")}
              >
                Quick
              </button>
              <button
                className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  previewMode === "sandbox"
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-white/50 hover:text-white/80"
                }`}
                onClick={() => setPreviewMode("sandbox")}
              >
                Sandbox
              </button>
            </div>

            <div className="flex items-center rounded-md border border-white/10 bg-white/5 p-0.5">
              <DeviceButton
                active={deviceViewport === "desktop"}
                onClick={() => setDeviceViewport("desktop")}
                icon={<Monitor className="h-3 w-3" />}
                tooltip="Desktop"
              />
              <DeviceButton
                active={deviceViewport === "tablet"}
                onClick={() => setDeviceViewport("tablet")}
                icon={<Tablet className="h-3 w-3" />}
                tooltip="Tablet"
              />
              <DeviceButton
                active={deviceViewport === "mobile"}
                onClick={() => setDeviceViewport("mobile")}
                icon={<Smartphone className="h-3 w-3" />}
                tooltip="Mobile"
              />
            </div>

            <div className="flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/40 font-mono min-w-[80px]">
              {urlPath}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={comingSoon}>
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Expand</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh}>
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh preview</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* === Right: Tools + Share + Publish + Avatar === */}
        <div className="flex items-center gap-1">
          {/* Tools dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 hidden sm:flex text-white/70 hover:text-white hover:bg-white/10">
                <Settings className="h-3 w-3" />
                Tools
                <ChevronDown className="h-2.5 w-2.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onGit}>
                <GitBranch className="mr-2 h-4 w-4" />
                Git / GitHub
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSupabase}>
                <Database className="mr-2 h-4 w-4" />
                Supabase
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onFigma}>
                <Figma className="mr-2 h-4 w-4" />
                Import from Figma
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onReview}>
                <Search className="mr-2 h-4 w-4" />
                AI Code Review
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAudit}>
                <Gauge className="mr-2 h-4 w-4" />
                Performance Audit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDomain}>
                <Globe className="mr-2 h-4 w-4" />
                Custom Domains
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExport}>
                <Smartphone className="mr-2 h-4 w-4" />
                Export Mobile App
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCollab}>
                <Users className="mr-2 h-4 w-4" />
                Team / Collaborate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 hidden sm:flex text-white/70 hover:text-white hover:bg-white/10"
            onClick={onShare ?? comingSoon}
          >
            <Share2 className="h-3 w-3" />
            Share
          </Button>

          <Button
            size="sm"
            className="h-7 text-xs gap-1.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white border-0"
            onClick={onPublish ?? comingSoon}
          >
            <Rocket className="h-3 w-3" />
            Publish
          </Button>

          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 ml-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={session.user.image ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Projects
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}

function ViewToggleButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      className={`relative flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-white/15 text-white shadow-sm"
          : "text-white/50 hover:text-white/80"
      }`}
      onClick={onClick}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

function DeviceButton({
  active,
  onClick,
  icon,
  tooltip,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={`rounded p-1 transition-colors ${
            active
              ? "bg-white/15 text-white shadow-sm"
              : "text-white/50 hover:text-white/80"
          }`}
          onClick={onClick}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
