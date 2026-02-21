"use client";

import { useState, useCallback } from "react";
import { Copy, Check, ChevronDown, ChevronRight } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  fileName?: string;
}

const KEYWORD_PATTERNS: Record<string, RegExp> = {
  javascript: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|try|catch|throw|new|typeof|instanceof|switch|case|break|continue|this|null|undefined|true|false)\b/g,
  typescript: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|try|catch|throw|new|typeof|instanceof|switch|case|break|continue|this|null|undefined|true|false|interface|type|enum|implements|extends|readonly|public|private|protected|abstract|as|is|keyof|infer|never|unknown|any|void|string|number|boolean)\b/g,
  python: /\b(def|class|import|from|return|if|elif|else|for|while|try|except|finally|raise|with|as|lambda|yield|pass|break|continue|and|or|not|in|is|None|True|False|self|print|async|await)\b/g,
  html: /(&lt;\/?)([\w-]+)/g,
  css: /\b(display|flex|grid|margin|padding|border|color|background|font|width|height|position|top|left|right|bottom|z-index|overflow|opacity|transform|transition|animation|align|justify|gap)\b/g,
  json: /("[\w-]+")\s*:/g,
};

function highlightSyntax(code: string, language: string): string {
  let escaped = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Highlight strings
  escaped = escaped.replace(
    /(["'`])(?:(?!\1|\\).|\\.)*?\1/g,
    '<span class="text-emerald-400">$&</span>'
  );

  // Highlight comments
  escaped = escaped.replace(
    /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm,
    '<span class="text-white/30 italic">$&</span>'
  );

  // Highlight numbers
  escaped = escaped.replace(
    /\b(\d+\.?\d*)\b/g,
    '<span class="text-orange-400">$1</span>'
  );

  // Language-specific keywords
  const lang = language.toLowerCase();
  const pattern =
    KEYWORD_PATTERNS[lang] ||
    KEYWORD_PATTERNS["javascript"];

  if (lang !== "json" && lang !== "html") {
    escaped = escaped.replace(
      pattern,
      '<span class="text-violet-400 font-semibold">$&</span>'
    );
  } else if (lang === "json") {
    escaped = escaped.replace(
      KEYWORD_PATTERNS.json,
      '<span class="text-sky-400">$1</span>:'
    );
  }

  return escaped;
}

export default function CodeBlock({
  code,
  language = "plaintext",
  fileName,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const lines = code.split("\n");
  const highlighted = highlightSyntax(code, language);
  const highlightedLines = highlighted.split("\n");

  return (
    <div className="rounded-lg border border-[#2a2a35] bg-[#0f0f14] overflow-hidden my-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a22] border-b border-[#2a2a35]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-white/50 hover:text-white/80 transition-colors"
            aria-label={collapsed ? "Expand code" : "Collapse code"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {fileName && (
            <span className="text-xs text-white/60 font-mono">
              {fileName}
            </span>
          )}
          <span className="text-xs text-white/30 uppercase tracking-wide">
            {language}
          </span>
          {collapsed && (
            <span className="text-xs text-white/30">
              ({lines.length} lines)
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors px-2 py-1 rounded hover:bg-white/5"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              {highlightedLines.map((line, index) => (
                <tr
                  key={index}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-0 text-right text-xs text-white/20 select-none font-mono w-[1%] whitespace-nowrap align-top leading-6">
                    {index + 1}
                  </td>
                  <td className="px-4 py-0 font-mono text-sm text-white/80 whitespace-pre leading-6">
                    <span dangerouslySetInnerHTML={{ __html: line }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
