/**
 * Content Security Policy Configuration
 *
 * Returns CSP headers tailored for the AppMake application.
 * Balances security with the need to load CDN resources (Tailwind, fonts),
 * render blob: iframe previews, and communicate with backend services.
 */

/**
 * Build the CSP directives for the application.
 *
 * Directives are structured as an object for easy inspection and testing.
 * The `getCSPHeaders()` function serializes them into the final header string.
 */
function buildDirectives(): Record<string, string[]> {
  return {
    "default-src": ["'self'"],

    "script-src": [
      "'self'",
      "'unsafe-inline'", // Required for Next.js inline scripts
      "'unsafe-eval'", // Required for Babel standalone in-browser transforms
      "https://cdn.tailwindcss.com",
      "https://unpkg.com",
      "https://cdnjs.cloudflare.com",
      "https://cdn.jsdelivr.net",
      "https://esm.sh", // esm.sh CDN for npm packages in preview
      "https://va.vercel-scripts.com", // Vercel Analytics
      "blob:",
    ],

    "style-src": [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind/styled-components runtime styles
      "https://cdn.tailwindcss.com",
      "https://fonts.googleapis.com",
      "https://cdnjs.cloudflare.com",
      "https://cdn.jsdelivr.net",
      "https://unpkg.com",
    ],

    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https:",
    ],

    "font-src": [
      "'self'",
      "data:",
      "https://fonts.gstatic.com",
      "https://cdnjs.cloudflare.com",
      "https://cdn.jsdelivr.net",
    ],

    "connect-src": [
      "'self'",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "https://api.openai.com",
      "https://api.anthropic.com",
      "https://vitals.vercel-insights.com", // Vercel Speed Insights
      "https://va.vercel-scripts.com",
      "https://esm.sh", // esm.sh CDN for npm packages in preview
      "https://cdn.tailwindcss.com",
      "https://*.webcontainer-api.io", // WebContainer communication
      "wss://*.webcontainer-api.io", // WebContainer WebSocket + npm registry proxy
    ],

    "frame-src": [
      "'self'",
      "blob:",
      "https://*.webcontainer-api.io", // WebContainer dev server origin
    ],

    "media-src": [
      "'self'",
      "blob:",
    ],

    "object-src": ["'none'"],

    "base-uri": ["'self'"],

    "form-action": ["'self'"],

    "frame-ancestors": ["'self'"],

    "worker-src": [
      "'self'",
      "blob:",
    ],

    "child-src": [
      "'self'",
      "blob:",
    ],
  };
}

/**
 * Serialize CSP directives into a single header-value string.
 */
function serializeDirectives(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}

/**
 * Returns an object of HTTP headers to be applied to responses.
 *
 * Includes:
 * - Content-Security-Policy
 * - X-Content-Type-Options
 * - X-Frame-Options
 * - X-XSS-Protection (legacy, but still useful for older browsers)
 * - Referrer-Policy
 * - Permissions-Policy
 * - Strict-Transport-Security
 */
export function getCSPHeaders(): Record<string, string> {
  const directives = buildDirectives();
  const cspValue = serializeDirectives(directives);

  return {
    "Content-Security-Policy": cspValue,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=()",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  };
}

/**
 * Returns just the CSP directive object for inspection/testing.
 */
export function getCSPDirectives(): Record<string, string[]> {
  return buildDirectives();
}
