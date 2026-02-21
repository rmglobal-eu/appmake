"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import CodeBlock from "./CodeBlock";

interface MarkdownRendererProps {
  content: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-white mt-6 mb-3 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-bold text-white mt-5 mb-2.5 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-white mt-4 mb-2 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-semibold text-white/90 mt-3 mb-1.5 first:mt-0">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-sm text-white/80 leading-relaxed mb-3 last:mb-0">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-white/70">{children}</em>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside space-y-1 mb-3 text-sm text-white/80 pl-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1 mb-3 text-sm text-white/80 pl-1">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-sm text-white/80 leading-relaxed">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-violet-500/40 pl-4 py-1 my-3 text-white/60 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-[#2a2a35] my-4" />,
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    const codeString = String(children).replace(/\n$/, "");

    // Block code (inside pre > code with language class)
    if (match) {
      return <CodeBlock code={codeString} language={match[1]} />;
    }

    // Check if it's a multi-line code block without language
    if (codeString.includes("\n")) {
      return <CodeBlock code={codeString} language="plaintext" />;
    }

    // Inline code
    return (
      <code
        className="bg-white/[0.08] text-violet-300 px-1.5 py-0.5 rounded text-[13px] font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => {
    // The code component handles rendering CodeBlock, so pre just passes through
    return <>{children}</>;
  },
  table: ({ children }) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-[#2a2a35]">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[#1a1a22] border-b border-[#2a2a35]">
      {children}
    </thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-[#2a2a35] last:border-b-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-sm text-white/70">{children}</td>
  ),
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
