import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center gap-6 px-4 py-24 text-center sm:py-32">
        <Image
          src="/logo-dark.svg"
          alt="AppMake"
          width={260}
          height={50}
          priority
          className="hidden dark:block"
        />
        <Image
          src="/logo-light.svg"
          alt="AppMake"
          width={260}
          height={50}
          priority
          className="block dark:hidden"
        />
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Build apps with AI
        </h1>
        <p className="max-w-lg text-lg text-muted-foreground">
          Describe what you want, and we build it. From idea to deployed app in
          minutes — no coding required.
        </p>
        <div className="flex gap-3">
          <Link
            href="/register"
            className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get started free
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-10 items-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-accent"
          >
            View pricing
          </Link>
        </div>
      </section>
    </div>
  );
}
