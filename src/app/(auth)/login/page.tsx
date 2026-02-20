"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  return (
    <div className="flex h-screen flex-col">
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sign in to AppMake</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose your preferred sign-in method
          </p>
        </div>
        <div className="flex w-full max-w-sm flex-col gap-3">
          {/* Dev mode login */}
          <Button
            onClick={() =>
              signIn("credentials", {
                email: "dev@appmake.dk",
                callbackUrl: "/",
              })
            }
            size="lg"
            className="w-full"
          >
            Dev Login (No OAuth needed)
          </Button>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">
                or with OAuth
              </span>
            </div>
          </div>
          <Button
            onClick={() => signIn("github", { callbackUrl: "/" })}
            size="lg"
            variant="outline"
            className="w-full"
          >
            Continue with GitHub
          </Button>
          <Button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            size="lg"
            variant="outline"
            className="w-full"
          >
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}
