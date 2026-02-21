export interface EnhancedContext {
  projectType: "web-app" | "library" | "api" | "fullstack" | "unknown";
  framework: string | null;
  dependencies: string[];
  patterns: DetectedPattern[];
  fileTree: string;
  relevantFiles: string[];
}

export interface DetectedPattern {
  name: string;
  category: "state-management" | "routing" | "styling" | "data-fetching" | "testing" | "build";
  confidence: number;
}

function detectFramework(files: Record<string, string>): string | null {
  const fileNames = Object.keys(files);
  const allContent = Object.values(files).join("\n");

  if (
    fileNames.some((f) => f.includes("next.config")) ||
    allContent.includes("from 'next") ||
    allContent.includes('from "next')
  ) {
    return "next.js";
  }

  if (
    fileNames.some((f) => f.includes("nuxt.config")) ||
    allContent.includes("from 'nuxt") ||
    allContent.includes("defineNuxtConfig")
  ) {
    return "nuxt";
  }

  if (
    fileNames.some((f) => f.includes("vite.config")) &&
    (allContent.includes("from 'vue") || allContent.includes('from "vue'))
  ) {
    return "vue";
  }

  if (
    allContent.includes("from 'react") ||
    allContent.includes('from "react') ||
    allContent.includes("from 'react-dom")
  ) {
    if (fileNames.some((f) => f.includes("vite.config"))) {
      return "react-vite";
    }
    return "react";
  }

  if (
    allContent.includes("from '@angular") ||
    allContent.includes("from 'angular") ||
    fileNames.some((f) => f.includes("angular.json"))
  ) {
    return "angular";
  }

  if (
    allContent.includes("from 'svelte") ||
    allContent.includes('from "svelte') ||
    fileNames.some((f) => f.endsWith(".svelte"))
  ) {
    return "svelte";
  }

  return null;
}

function detectProjectType(
  files: Record<string, string>,
  framework: string | null
): EnhancedContext["projectType"] {
  const fileNames = Object.keys(files);
  const hasPages =
    fileNames.some((f) => f.includes("/pages/")) ||
    fileNames.some((f) => f.includes("/app/"));
  const hasAPI =
    fileNames.some((f) => f.includes("/api/")) ||
    fileNames.some((f) => f.includes("server.") || f.includes("app.ts") || f.includes("app.js"));
  const hasComponents = fileNames.some((f) => f.includes("/components/"));

  if (hasPages && hasAPI) return "fullstack";
  if (hasPages || hasComponents) return "web-app";
  if (hasAPI) return "api";

  if (
    fileNames.some(
      (f) =>
        f.includes("index.ts") ||
        f.includes("index.js") ||
        f.includes("lib/")
    ) &&
    !hasComponents
  ) {
    return "library";
  }

  return framework ? "web-app" : "unknown";
}

function detectDependencies(files: Record<string, string>): string[] {
  const deps: Set<string> = new Set();
  const allContent = Object.values(files).join("\n");

  const importRegex = /(?:from\s+['"]|require\s*\(\s*['"])([^./][^'"]*)['"]/g;
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(allContent)) !== null) {
    const pkg = match[1];
    const basePkg = pkg.startsWith("@")
      ? pkg.split("/").slice(0, 2).join("/")
      : pkg.split("/")[0];
    deps.add(basePkg);
  }

  for (const [path, content] of Object.entries(files)) {
    if (path.endsWith("package.json")) {
      try {
        const pkg = JSON.parse(content);
        const allDeps = {
          ...pkg.dependencies,
          ...pkg.devDependencies,
        };
        for (const dep of Object.keys(allDeps)) {
          deps.add(dep);
        }
      } catch {
        // skip malformed package.json
      }
    }
  }

  return Array.from(deps).sort();
}

function detectPatterns(
  files: Record<string, string>,
  dependencies: string[]
): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  const allContent = Object.values(files).join("\n");
  const depSet = new Set(dependencies);

  // State management
  if (depSet.has("zustand") || allContent.includes("create(") && allContent.includes("zustand")) {
    patterns.push({ name: "zustand", category: "state-management", confidence: 0.95 });
  }
  if (depSet.has("redux") || depSet.has("@reduxjs/toolkit")) {
    patterns.push({ name: "redux", category: "state-management", confidence: 0.95 });
  }
  if (depSet.has("jotai")) {
    patterns.push({ name: "jotai", category: "state-management", confidence: 0.95 });
  }
  if (depSet.has("recoil")) {
    patterns.push({ name: "recoil", category: "state-management", confidence: 0.95 });
  }
  if (allContent.includes("useState") || allContent.includes("useReducer")) {
    patterns.push({ name: "react-hooks", category: "state-management", confidence: 0.8 });
  }

  // Routing
  if (depSet.has("react-router") || depSet.has("react-router-dom")) {
    patterns.push({ name: "react-router", category: "routing", confidence: 0.95 });
  }
  if (depSet.has("next")) {
    patterns.push({ name: "next-router", category: "routing", confidence: 0.9 });
  }

  // Styling
  if (depSet.has("tailwindcss") || allContent.includes("tailwind")) {
    patterns.push({ name: "tailwind", category: "styling", confidence: 0.9 });
  }
  if (depSet.has("styled-components")) {
    patterns.push({ name: "styled-components", category: "styling", confidence: 0.95 });
  }
  if (depSet.has("@emotion/react") || depSet.has("@emotion/styled")) {
    patterns.push({ name: "emotion", category: "styling", confidence: 0.95 });
  }
  if (Object.keys(files).some((f) => f.endsWith(".module.css") || f.endsWith(".module.scss"))) {
    patterns.push({ name: "css-modules", category: "styling", confidence: 0.9 });
  }

  // Data fetching
  if (depSet.has("@tanstack/react-query") || depSet.has("react-query")) {
    patterns.push({ name: "react-query", category: "data-fetching", confidence: 0.95 });
  }
  if (depSet.has("swr")) {
    patterns.push({ name: "swr", category: "data-fetching", confidence: 0.95 });
  }
  if (depSet.has("axios")) {
    patterns.push({ name: "axios", category: "data-fetching", confidence: 0.9 });
  }
  if (allContent.includes("fetch(")) {
    patterns.push({ name: "fetch-api", category: "data-fetching", confidence: 0.7 });
  }

  // Testing
  if (depSet.has("vitest")) {
    patterns.push({ name: "vitest", category: "testing", confidence: 0.95 });
  }
  if (depSet.has("jest")) {
    patterns.push({ name: "jest", category: "testing", confidence: 0.95 });
  }
  if (depSet.has("@testing-library/react")) {
    patterns.push({ name: "testing-library", category: "testing", confidence: 0.95 });
  }

  // Build
  if (depSet.has("vite")) {
    patterns.push({ name: "vite", category: "build", confidence: 0.95 });
  }
  if (depSet.has("webpack")) {
    patterns.push({ name: "webpack", category: "build", confidence: 0.95 });
  }
  if (depSet.has("turbopack") || depSet.has("next")) {
    patterns.push({ name: "turbopack", category: "build", confidence: 0.6 });
  }

  return patterns;
}

function buildFileTree(files: Record<string, string>): string {
  const paths = Object.keys(files).sort();
  const lines: string[] = [];
  const seen = new Set<string>();

  for (const filePath of paths) {
    const parts = filePath.split("/").filter(Boolean);

    for (let i = 0; i < parts.length; i++) {
      const dirPath = parts.slice(0, i + 1).join("/");
      if (seen.has(dirPath)) continue;
      seen.add(dirPath);

      const indent = "  ".repeat(i);
      const isFile = i === parts.length - 1;
      const prefix = isFile ? "- " : "+ ";
      lines.push(`${indent}${prefix}${parts[i]}`);
    }
  }

  return lines.join("\n");
}

function findRelevantFiles(
  files: Record<string, string>,
  userMessage: string
): string[] {
  const messageLower = userMessage.toLowerCase();
  const keywords = messageLower
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/[^a-z0-9]/g, ""));

  const scored: { path: string; score: number }[] = [];

  for (const [filePath, content] of Object.entries(files)) {
    let score = 0;
    const pathLower = filePath.toLowerCase();
    const contentLower = content.toLowerCase();

    for (const keyword of keywords) {
      if (pathLower.includes(keyword)) score += 3;
      const occurrences = contentLower.split(keyword).length - 1;
      score += Math.min(occurrences, 5);
    }

    if (
      filePath.endsWith(".tsx") ||
      filePath.endsWith(".ts") ||
      filePath.endsWith(".jsx") ||
      filePath.endsWith(".js")
    ) {
      score += 1;
    }

    if (score > 0) {
      scored.push({ path: filePath, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 10).map((s) => s.path);
}

export function enhanceContext(
  files: Record<string, string>,
  userMessage: string
): EnhancedContext {
  const framework = detectFramework(files);
  const dependencies = detectDependencies(files);
  const projectType = detectProjectType(files, framework);
  const patterns = detectPatterns(files, dependencies);
  const fileTree = buildFileTree(files);
  const relevantFiles = findRelevantFiles(files, userMessage);

  return {
    projectType,
    framework,
    dependencies,
    patterns,
    fileTree,
    relevantFiles,
  };
}
