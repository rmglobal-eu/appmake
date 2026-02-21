/**
 * Next.js Middleware
 *
 * Applies security headers (CSP), rate limiting, and auth protection.
 *
 * - All matched routes receive CSP and security headers.
 * - /api/* routes additionally receive rate limiting.
 * - Auth-protected routes (/dashboard, /new, /chat, /templates) require authentication.
 * - Static files, images, and Next.js internals are excluded via the matcher config.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { getCSPHeaders } from "@/lib/security/csp-config";
import { checkRateLimit } from "@/lib/security/rate-limiter";

// Routes that require authentication
const AUTH_PROTECTED_PATHS = [
  "/dashboard",
  "/new",
  "/chat",
  "/templates",
];

/**
 * Extract client IP from the request.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Extract user ID from the request.
 * Checks for auth session cookie or Authorization header.
 * Returns empty string if unauthenticated.
 */
function getUserId(request: NextRequest): string {
  const cookies = request.cookies;

  // Try to extract user ID from Supabase auth token cookie
  for (const [name, cookie] of cookies) {
    if (name.includes("auth-token") && cookie.value) {
      try {
        const decoded = atob(cookie.value.split(".")[1] || "");
        const payload = JSON.parse(decoded);
        if (payload.sub) return payload.sub;
      } catch {
        return `cookie:${name}`;
      }
    }
  }

  // Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const decoded = atob(token.split(".")[1] || "");
      const payload = JSON.parse(decoded);
      if (payload.sub) return payload.sub;
    } catch {
      return "bearer:unknown";
    }
  }

  return "";
}

/**
 * Check if a pathname matches any of the auth-protected paths.
 */
function isAuthProtected(pathname: string): boolean {
  return AUTH_PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
}

/**
 * Apply CSP and security headers to a response.
 */
function applySecurityHeaders(response: NextResponse): void {
  const cspHeaders = getCSPHeaders();
  for (const [key, value] of Object.entries(cspHeaders)) {
    response.headers.set(key, value);
  }
}

export default auth(async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Auth-protected routes: redirect to login if not authenticated
  if (isAuthProtected(pathname)) {
    if (!request.auth?.user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      applySecurityHeaders(redirectResponse);
      return redirectResponse;
    }
  }

  // Rate limiting for API routes
  if (pathname.startsWith("/api")) {
    const ip = getClientIp(request);
    const userId = getUserId(request);

    const rateLimitResult = await checkRateLimit(userId, ip);

    if (!rateLimitResult.allowed) {
      const errorResponse = new NextResponse(
        JSON.stringify({
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: rateLimitResult.resetAt.toISOString(),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil(
              (rateLimitResult.resetAt.getTime() - Date.now()) / 1000
            ).toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetAt.toISOString(),
          },
        }
      );
      applySecurityHeaders(errorResponse);
      return errorResponse;
    }

    // API response with rate limit headers
    const response = NextResponse.next();
    applySecurityHeaders(response);
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimitResult.remaining.toString()
    );
    response.headers.set(
      "X-RateLimit-Reset",
      rateLimitResult.resetAt.toISOString()
    );
    return response;
  }

  // All other routes: apply security headers only
  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
});

/**
 * Matcher configuration.
 *
 * Matches all routes EXCEPT:
 * - /_next/static/* (Next.js static files)
 * - /_next/image/* (Next.js image optimization)
 * - /favicon.ico, /robots.txt, /sitemap.xml (standard static files)
 * - Files with common static extensions
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
