import { tool } from "ai";
import { z } from "zod";

async function searchWithDuckDuckGo(query: string, maxResults: number) {
  // Use DuckDuckGo HTML search and scrape results for better coverage
  const res = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    }
  );

  const html = await res.text();

  // Parse search results from HTML
  const results: { title: string; url: string; snippet: string }[] = [];
  const resultRegex =
    /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
    const rawUrl = match[1];
    const title = match[2].replace(/<[^>]+>/g, "").trim();
    const snippet = match[3].replace(/<[^>]+>/g, "").trim();

    // DuckDuckGo wraps URLs in a redirect — extract the real URL
    let url = rawUrl;
    const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
    if (uddgMatch) {
      url = decodeURIComponent(uddgMatch[1]);
    }

    if (title && url) {
      results.push({ title, url, snippet });
    }
  }

  // Fallback to instant answer API if HTML parsing got nothing
  if (results.length === 0) {
    const apiRes = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    );
    const data = await apiRes.json();

    if (data.AbstractText) {
      results.push({
        title: data.Heading || "Result",
        url: data.AbstractURL || "",
        snippet: data.AbstractText,
      });
    }

    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, maxResults)) {
        if (topic.Text) {
          results.push({
            title: topic.Text.split(" - ")[0] || "Related",
            url: topic.FirstURL || "",
            snippet: topic.Text,
          });
        }
      }
    }
  }

  return results;
}

export const webSearchTool = tool({
  description:
    "Search the web for current information. Use this when you need up-to-date information, documentation, APIs, recent events, or anything that might have changed recently. Always search when the user asks about current events, new technologies, or specific libraries/frameworks.",
  inputSchema: z.object({
    query: z.string().describe("The search query — be specific and include relevant keywords"),
    maxResults: z
      .number()
      .optional()
      .default(5)
      .describe("Maximum number of results to return"),
  }),
  execute: async ({ query, maxResults }: { query: string; maxResults: number }) => {
    const tavilyKey = process.env.TAVILY_API_KEY;

    if (tavilyKey) {
      // Primary: Tavily Search API
      try {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: tavilyKey,
            query,
            max_results: maxResults,
            include_answer: true,
            include_raw_content: false,
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            query,
            answer: data.answer || null,
            results: (data.results || []).map(
              (r: { title: string; url: string; content: string }) => ({
                title: r.title,
                url: r.url,
                snippet: r.content,
              })
            ),
            source: "tavily",
          };
        }
      } catch {
        // Fall through to DuckDuckGo
      }
    }

    // Fallback: DuckDuckGo HTML search
    try {
      const results = await searchWithDuckDuckGo(query, maxResults);
      return {
        query,
        answer: null,
        results: results.length > 0 ? results : [{ title: "No results", url: "", snippet: "No results found for this query." }],
        source: "duckduckgo",
      };
    } catch {
      return {
        query,
        answer: null,
        results: [{ title: "Search failed", url: "", snippet: "Could not perform web search. Try again." }],
        source: "error",
      };
    }
  },
});

export const fetchUrlTool = tool({
  description:
    "Fetch and read the content of a URL. Use this to read documentation pages, articles, blog posts, or any web page. Combine with webSearch to first find relevant URLs, then fetch their content for detailed information.",
  inputSchema: z.object({
    url: z.string().url().describe("The URL to fetch"),
  }),
  execute: async ({ url }: { url: string }) => {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8",
        },
        signal: AbortSignal.timeout(15000),
        redirect: "follow",
      });

      if (!res.ok) {
        return { url, error: `Failed to fetch: ${res.status} ${res.statusText}` };
      }

      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();

      if (contentType.includes("html")) {
        // Extract main content more intelligently
        let content = text;

        // Try to extract <main> or <article> content first
        const mainMatch = content.match(/<(?:main|article)[^>]*>([\s\S]*?)<\/(?:main|article)>/i);
        if (mainMatch) {
          content = mainMatch[1];
        }

        // Strip non-content elements
        content = content
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
          .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
          .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, " ")
          .trim();

        return {
          url,
          content: content.slice(0, 12000),
          truncated: content.length > 12000,
        };
      }

      return {
        url,
        content: text.slice(0, 12000),
        truncated: text.length > 12000,
      };
    } catch (err) {
      return {
        url,
        error: `Failed to fetch: ${err instanceof Error ? err.message : "Unknown error"}`,
      };
    }
  },
});

export const generateImageTool = tool({
  description:
    "Generate an image using AI. Use this to create hero backgrounds, feature images, product photos, team photos, and any visual content for the website. Generate images BEFORE writing code that uses them. Returns a URL to the generated image.",
  inputSchema: z.object({
    prompt: z
      .string()
      .describe(
        "Detailed image description. Be specific: include subject, style, lighting, mood, and composition. Example: 'Modern coffee shop interior, warm lighting, wooden tables, latte art close-up, cozy atmosphere, editorial photography style'"
      ),
    aspect_ratio: z
      .enum(["16:9", "1:1", "9:16", "4:3", "3:2"])
      .optional()
      .default("16:9")
      .describe("Image aspect ratio. Use 16:9 for heroes/banners, 1:1 for cards/avatars, 4:3 for features, 9:16 for mobile"),
  }),
  execute: async ({ prompt, aspect_ratio }: { prompt: string; aspect_ratio: string }) => {
    const fallbackUrl = `https://placehold.co/1200x675/1a1a2e/ffffff?text=${encodeURIComponent(prompt.slice(0, 30))}`;

    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      return {
        url: fallbackUrl,
        source: "placeholder",
        note: "REPLICATE_API_TOKEN not set — using placeholder image",
      };
    }

    try {
      const res = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
          Prefer: "wait",
        },
        body: JSON.stringify({
          model: "black-forest-labs/flux-schnell",
          input: {
            prompt,
            aspect_ratio,
            num_outputs: 1,
          },
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        return {
          url: fallbackUrl,
          error: `Replicate API error: ${res.status} ${errText}`,
          source: "placeholder",
        };
      }

      const data = await res.json();
      const imageUrl = data.output?.[0] ?? data.output;

      if (!imageUrl || typeof imageUrl !== "string") {
        return {
          url: fallbackUrl,
          error: "No image URL in response",
          source: "placeholder",
        };
      }

      return {
        url: imageUrl,
        source: "replicate",
      };
    } catch (err) {
      return {
        url: fallbackUrl,
        error: `Image generation failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        source: "placeholder",
      };
    }
  },
});

export const allTools = {
  webSearch: webSearchTool,
  fetchUrl: fetchUrlTool,
  generateImage: generateImageTool,
};
