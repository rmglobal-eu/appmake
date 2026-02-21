/**
 * Input Sanitization Utilities
 *
 * Provides sanitization for user input to prevent XSS, injection attacks,
 * and other security issues. All functions are synchronous and side-effect free.
 */

// HTML tags considered safe for sanitizeHtml (subset of common safe tags)
const SAFE_TAGS = new Set([
  "a",
  "abbr",
  "b",
  "blockquote",
  "br",
  "code",
  "dd",
  "div",
  "dl",
  "dt",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

// Attributes considered safe (per tag-agnostic allowlist)
const SAFE_ATTRIBUTES = new Set([
  "href",
  "src",
  "alt",
  "title",
  "class",
  "id",
  "width",
  "height",
  "target",
  "rel",
]);

// Patterns for detecting XSS vectors
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi, // Event handlers with quotes
  /on\w+\s*=\s*[^\s>]+/gi, // Event handlers without quotes
  /expression\s*\(/gi, // CSS expressions
  /url\s*\(\s*["']?\s*javascript/gi,
  /<iframe\b[^>]*>/gi,
  /<object\b[^>]*>/gi,
  /<embed\b[^>]*>/gi,
  /<form\b[^>]*>/gi,
  /<input\b[^>]*>/gi,
  /<button\b[^>]*>/gi,
  /<textarea\b[^>]*>/gi,
  /<select\b[^>]*>/gi,
  /<meta\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /<base\b[^>]*>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
];

// Characters that should be HTML-encoded in text content
const HTML_ENCODE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

const HTML_ENCODE_REGEX = /[&<>"'`/]/g;

/**
 * Encode special HTML characters to their entity equivalents.
 */
function htmlEncode(str: string): string {
  return str.replace(HTML_ENCODE_REGEX, (char) => HTML_ENCODE_MAP[char] || char);
}

/**
 * Strip all XSS vectors from input text.
 *
 * This is the most aggressive sanitizer -- it removes all HTML tags
 * and dangerous patterns, returning plain text safe for rendering.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  let sanitized = input;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Decode HTML entities that might hide attacks (double-encoding prevention)
  sanitized = sanitized
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);?/g, (_, dec) =>
      String.fromCharCode(parseInt(dec, 10))
    );

  // Remove all script tags and their contents
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );

  // Remove event handlers (on* attributes)
  sanitized = sanitized.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // Remove javascript: and vbscript: protocols
  sanitized = sanitized.replace(/(?:javascript|vbscript)\s*:/gi, "");

  // Remove all HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Encode remaining special characters
  sanitized = htmlEncode(sanitized);

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize HTML content, preserving safe tags and removing dangerous ones.
 *
 * Keeps structural and formatting tags from the SAFE_TAGS set.
 * Removes all event handlers and dangerous attributes.
 * Strips unsafe tags and their content (script, style, iframe, etc.).
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== "string") return "";

  let sanitized = html;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Remove script tags and their contents
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );

  // Remove style tags and their contents
  sanitized = sanitized.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    ""
  );

  // Remove dangerous tags entirely (iframe, object, embed, form elements, meta, link, base)
  const dangerousTags = [
    "iframe",
    "object",
    "embed",
    "form",
    "input",
    "button",
    "textarea",
    "select",
    "meta",
    "link",
    "base",
    "applet",
    "frame",
    "frameset",
    "layer",
    "ilayer",
    "bgsound",
  ];
  for (const tag of dangerousTags) {
    const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi");
    const withContent = new RegExp(
      `<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`,
      "gi"
    );
    sanitized = sanitized.replace(withContent, "");
    sanitized = sanitized.replace(selfClosing, "");
  }

  // Process remaining tags: keep safe ones, strip unsafe ones
  sanitized = sanitized.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (match, tag, attrs) => {
    const lowerTag = tag.toLowerCase();

    // If tag is not in safe list, remove it entirely
    if (!SAFE_TAGS.has(lowerTag)) {
      return "";
    }

    // For closing tags, return them as-is
    if (match.startsWith("</")) {
      return `</${lowerTag}>`;
    }

    // Filter attributes: remove event handlers and non-safe attributes
    const cleanAttrs = sanitizeAttributes(attrs, lowerTag);
    const selfClose = match.endsWith("/>") ? " /" : "";

    return `<${lowerTag}${cleanAttrs}${selfClose}>`;
  });

  return sanitized.trim();
}

/**
 * Filter attributes, keeping only safe ones and removing event handlers.
 */
function sanitizeAttributes(attrString: string, tag: string): string {
  if (!attrString || !attrString.trim()) return "";

  const attrs: string[] = [];

  // Match attribute patterns: name="value", name='value', name=value, name
  const attrRegex = /([a-zA-Z_][\w-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  let attrMatch: RegExpExecArray | null;

  while ((attrMatch = attrRegex.exec(attrString)) !== null) {
    const name = attrMatch[1].toLowerCase();
    const value = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "";

    // Skip event handlers
    if (name.startsWith("on")) continue;

    // Skip non-safe attributes
    if (!SAFE_ATTRIBUTES.has(name)) continue;

    // For href and src, validate the URL
    if (name === "href" || name === "src") {
      const cleanUrl = sanitizeUrl(value);
      if (!cleanUrl) continue;
      attrs.push(`${name}="${htmlEncode(cleanUrl)}"`);
      continue;
    }

    attrs.push(`${name}="${htmlEncode(value)}"`);
  }

  // For links, enforce rel="noopener noreferrer" on external targets
  if (tag === "a") {
    const hasTarget = attrs.some((a) => a.startsWith("target="));
    if (hasTarget) {
      // Remove any existing rel and add safe one
      const filtered = attrs.filter((a) => !a.startsWith("rel="));
      filtered.push('rel="noopener noreferrer"');
      return filtered.length > 0 ? " " + filtered.join(" ") : "";
    }
  }

  return attrs.length > 0 ? " " + attrs.join(" ") : "";
}

/**
 * Validate and sanitize a URL.
 *
 * Returns the sanitized URL string, or an empty string if the URL is
 * invalid or uses a dangerous protocol.
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== "string") return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  // Remove null bytes and control characters
  const cleaned = trimmed.replace(/[\0\x01-\x1f\x7f]/g, "");

  // Check for dangerous protocols
  const protocolMatch = cleaned.match(/^([a-zA-Z][a-zA-Z0-9+.-]*)\s*:/);
  if (protocolMatch) {
    const protocol = protocolMatch[1].toLowerCase();
    const allowedProtocols = ["http", "https", "mailto", "tel"];
    if (!allowedProtocols.includes(protocol)) {
      return "";
    }
  }

  // Block javascript: with whitespace/encoding tricks
  if (/^\s*j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/i.test(cleaned)) {
    return "";
  }

  // Block data: URIs (except data:image for safe image formats)
  if (/^data:/i.test(cleaned)) {
    if (/^data:image\/(png|jpeg|jpg|gif|svg\+xml|webp);base64,/i.test(cleaned)) {
      return cleaned;
    }
    return "";
  }

  // Relative URLs are fine
  if (cleaned.startsWith("/") || cleaned.startsWith("#") || cleaned.startsWith("?")) {
    return cleaned;
  }

  // Try to parse as a proper URL
  try {
    const parsed = new URL(cleaned);
    if (!["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) {
      return "";
    }
    return parsed.toString();
  } catch {
    // If it doesn't parse as absolute, allow it as relative
    if (!cleaned.includes("://")) {
      return cleaned;
    }
    return "";
  }
}

/**
 * Sanitize a filename for safe filesystem usage.
 *
 * - Removes path traversal components
 * - Removes or replaces dangerous characters
 * - Limits length to 255 characters
 * - Preserves the file extension
 */
export function sanitizeFileName(name: string): string {
  if (typeof name !== "string") return "unnamed";

  let sanitized = name;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Remove path traversal
  sanitized = sanitized.replace(/\.\.\//g, "");
  sanitized = sanitized.replace(/\.\.\\/g, "");

  // Extract just the filename (no directory components)
  sanitized = sanitized.replace(/^.*[/\\]/, "");

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1f\x7f]/g, "");

  // Replace dangerous characters with underscores
  // Keep: alphanumeric, dots, hyphens, underscores, spaces
  sanitized = sanitized.replace(/[^a-zA-Z0-9.\-_ ]/g, "_");

  // Prevent hidden files (leading dots)
  sanitized = sanitized.replace(/^\.+/, "");

  // Collapse multiple dots, underscores, spaces
  sanitized = sanitized.replace(/\.{2,}/g, ".");
  sanitized = sanitized.replace(/_{2,}/g, "_");
  sanitized = sanitized.replace(/\s{2,}/g, " ");

  // Trim whitespace and dots from edges
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, "");

  // Limit length (preserve extension)
  if (sanitized.length > 255) {
    const lastDot = sanitized.lastIndexOf(".");
    if (lastDot > 0) {
      const ext = sanitized.slice(lastDot);
      const base = sanitized.slice(0, 255 - ext.length);
      sanitized = base + ext;
    } else {
      sanitized = sanitized.slice(0, 255);
    }
  }

  // Fallback for empty result
  if (!sanitized) return "unnamed";

  return sanitized;
}
