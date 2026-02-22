"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, LogOut, FolderOpen } from "lucide-react";

export function NavHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("nav");
  const tc = useTranslations("common");

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-4">
      <button
        className="flex items-center gap-2"
        onClick={() => router.push("/dashboard")}
      >
        <Image
          src="/icon-dark.svg"
          alt="AppMake"
          width={28}
          height={28}
          className="hidden dark:block"
        />
        <Image
          src="/icon-light.svg"
          alt="AppMake"
          width={28}
          height={28}
          className="block dark:hidden"
        />
        <span className="text-sm font-semibold tracking-tight">AppMake</span>
      </button>

      <div className="flex items-center gap-2">
        {session && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => router.push("/new")}
          >
            <Plus className="mr-1 h-3 w-3" />
            {t("newProject")}
          </Button>
        )}
        <ThemeToggle />
        {session?.user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={session.user.image ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {session.user.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{session.user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                <FolderOpen className="mr-2 h-4 w-4" />
                {t("projects")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                {t("signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
