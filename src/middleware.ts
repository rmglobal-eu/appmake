export { auth as middleware } from "@/lib/auth/config";

export const config = {
  matcher: [
    // Protect all app routes except auth, public pages, share pages, and static assets
    "/((?!api/auth|auth|share|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
