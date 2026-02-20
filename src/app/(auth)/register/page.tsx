"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Create an Account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign up to start building apps with AI
        </p>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-3">
        <Button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          size="lg"
          className="w-full"
        >
          Sign up with GitHub
        </Button>
        <Button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          size="lg"
          variant="outline"
          className="w-full"
        >
          Sign up with Google
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Already have an account?{" "}
        <a href="/login" className="underline">
          Sign in
        </a>
      </p>
    </div>
  );
}
