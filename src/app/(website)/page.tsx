import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export default async function LandingPage() {
  const t = await getTranslations("landing");

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
          {t("buildAppsWithAI")}
        </h1>
        <p className="max-w-lg text-lg text-muted-foreground">
          {t("landingDescription")}
        </p>
        <div className="flex gap-3">
          <Link
            href="/register"
            className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("getStartedFree")}
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-10 items-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-accent"
          >
            {t("viewPricing")}
          </Link>
        </div>
      </section>
    </div>
  );
}
