import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth middleware disabled for development
// To re-enable OAuth protection, replace this with:
// export { auth as middleware } from "@/lib/auth/config";

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
