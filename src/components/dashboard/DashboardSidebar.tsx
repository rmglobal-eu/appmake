"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Search,
  FolderOpen,
  Star,
  Users,
  Compass,
  LayoutTemplate,
  Palette,
  Sparkles,
  Settings,
  LogOut,
  ChevronDown,
  X,
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

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-white/10 text-white"
          : "text-white/60 hover:bg-white/5 hover:text-white/80"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
      {badge && (
        <span className="ml-auto text-[10px] text-white/30">{badge}</span>
      )}
    </button>
  );
}

export function DashboardSidebar({ user, projects, isOpen, onClose }: DashboardSidebarProps) {
  const router = useRouter();
  const firstName = user.name?.split(" ")[0] || "User";
  const recentProjects = projects.slice(0, 5);

  const sidebarContent = (
    <div className="flex h-full w-60 flex-col bg-[#0f0f14] text-white">
      {/* Workspace header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 text-sm font-medium outline-none">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="bg-violet-600 text-xs text-white">
                {firstName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{firstName}&apos;s workspace</span>
            <ChevronDown className="h-3 w-3 text-white/40" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <div className="px-2 py-1.5 text-sm">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded text-white/40 hover:text-white md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-0.5">
          <NavItem icon={Home} label="Home" active />
          <NavItem icon={Search} label="Search" />
        </div>

        {/* Projects section */}
        <div className="mt-6">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">
            Projects
          </p>

          {/* Recent projects */}
          {recentProjects.length > 0 && (
            <div className="mb-1 space-y-0.5">
              {recentProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    router.push(`/chat/${p.id}`);
                    onClose();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white/80"
                >
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          )}

          <NavItem icon={FolderOpen} label="All projects" />
          <NavItem icon={Star} label="Starred" badge="Soon" />
          <NavItem icon={Users} label="Shared with me" badge="Soon" />
        </div>

        {/* Resources section */}
        <div className="mt-6">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">
            Resources
          </p>
          <NavItem icon={Compass} label="Discover" />
          <NavItem icon={LayoutTemplate} label="Templates" />
          <NavItem
            icon={Palette}
            label="Design System"
            onClick={() => {
              router.push("/design-system");
              onClose();
            }}
          />
        </div>
      </div>

      {/* Bottom section */}
      <div className="border-t border-white/10 p-3">
        {/* Upgrade card */}
        <div className="mb-3 rounded-xl bg-gradient-to-br from-violet-600/20 to-pink-600/20 p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-medium text-white">Upgrade to Pro</span>
          </div>
          <p className="mt-1 text-xs text-white/50">Unlimited projects & more</p>
        </div>

        {/* User */}
        <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/5">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="bg-violet-600 text-xs text-white">
              {firstName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{user.name}</span>
          <Settings className="ml-auto h-3.5 w-3.5 text-white/30" />
        </button>
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
    </>
  );
}
