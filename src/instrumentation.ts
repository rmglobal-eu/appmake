export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { markStaleGenerationsOnStartup } = await import(
      "@/lib/generation/generation-manager"
    );
    await markStaleGenerationsOnStartup();
  }
}
