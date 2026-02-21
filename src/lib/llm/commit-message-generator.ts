interface DiffStats {
  filesChanged: string[];
  additions: number;
  deletions: number;
  renamedFiles: string[];
  newFiles: string[];
  deletedFiles: string[];
  modifiedFiles: string[];
}

interface DiffHunk {
  file: string;
  addedLines: string[];
  removedLines: string[];
}

type CommitType = "feat" | "fix" | "refactor" | "docs" | "style" | "test" | "chore" | "perf" | "ci" | "build";

function parseDiff(diff: string): { stats: DiffStats; hunks: DiffHunk[] } {
  const lines = diff.split("\n");
  const stats: DiffStats = {
    filesChanged: [],
    additions: 0,
    deletions: 0,
    renamedFiles: [],
    newFiles: [],
    deletedFiles: [],
    modifiedFiles: [],
  };
  const hunks: DiffHunk[] = [];

  let currentFile = "";
  let currentHunk: DiffHunk | null = null;

  for (const line of lines) {
    // Detect file header
    const diffFileMatch = line.match(/^diff --git a\/(.+?) b\/(.+)/);
    if (diffFileMatch) {
      if (currentHunk) hunks.push(currentHunk);
      currentFile = diffFileMatch[2];
      currentHunk = { file: currentFile, addedLines: [], removedLines: [] };

      if (!stats.filesChanged.includes(currentFile)) {
        stats.filesChanged.push(currentFile);
      }
      continue;
    }

    // Detect new file
    if (line.startsWith("new file mode")) {
      stats.newFiles.push(currentFile);
      continue;
    }

    // Detect deleted file
    if (line.startsWith("deleted file mode")) {
      stats.deletedFiles.push(currentFile);
      continue;
    }

    // Detect rename
    const renameMatch = line.match(/^rename from (.+)/);
    if (renameMatch) {
      stats.renamedFiles.push(renameMatch[1]);
      continue;
    }

    // Added lines
    if (line.startsWith("+") && !line.startsWith("+++")) {
      const content = line.slice(1).trim();
      if (content) {
        stats.additions++;
        currentHunk?.addedLines.push(content);
      }
      continue;
    }

    // Removed lines
    if (line.startsWith("-") && !line.startsWith("---")) {
      const content = line.slice(1).trim();
      if (content) {
        stats.deletions++;
        currentHunk?.removedLines.push(content);
      }
      continue;
    }
  }

  if (currentHunk) hunks.push(currentHunk);

  // Determine modified files (not new, not deleted)
  stats.modifiedFiles = stats.filesChanged.filter(
    (f) => !stats.newFiles.includes(f) && !stats.deletedFiles.includes(f)
  );

  return { stats, hunks };
}

function detectCommitType(stats: DiffStats, hunks: DiffHunk[]): CommitType {
  const allAddedContent = hunks.flatMap((h) => h.addedLines).join("\n").toLowerCase();
  const allRemovedContent = hunks.flatMap((h) => h.removedLines).join("\n").toLowerCase();
  const allFiles = stats.filesChanged;

  // Test files
  const hasTestFiles = allFiles.some(
    (f) =>
      f.includes(".test.") ||
      f.includes(".spec.") ||
      f.includes("__tests__") ||
      f.includes("test/")
  );
  if (hasTestFiles && allFiles.every((f) => f.includes(".test.") || f.includes(".spec.") || f.includes("__tests__"))) {
    return "test";
  }

  // Documentation
  const hasDocFiles = allFiles.some(
    (f) =>
      f.endsWith(".md") ||
      f.endsWith(".mdx") ||
      f.includes("docs/") ||
      f.includes("documentation")
  );
  if (hasDocFiles && allFiles.every((f) => f.endsWith(".md") || f.endsWith(".mdx") || f.includes("docs/"))) {
    return "docs";
  }

  // JSDoc/comment-only changes
  if (
    allAddedContent.includes("@param") ||
    allAddedContent.includes("@returns") ||
    allAddedContent.includes("/**")
  ) {
    const onlyComments = hunks.every((h) =>
      h.addedLines.every(
        (l) =>
          l.trim().startsWith("*") ||
          l.trim().startsWith("//") ||
          l.trim().startsWith("/**") ||
          l.trim().startsWith("*/")
      )
    );
    if (onlyComments) return "docs";
  }

  // CI/CD files
  const hasCIFiles = allFiles.some(
    (f) =>
      f.includes(".github/workflows") ||
      f.includes("Dockerfile") ||
      f.includes(".gitlab-ci") ||
      f.includes("Jenkinsfile")
  );
  if (hasCIFiles) return "ci";

  // Build config
  const hasBuildFiles = allFiles.some(
    (f) =>
      f.includes("webpack") ||
      f.includes("vite.config") ||
      f.includes("tsconfig") ||
      f.includes("next.config") ||
      f === "package.json"
  );
  if (hasBuildFiles && allFiles.every((f) => !f.endsWith(".ts") && !f.endsWith(".tsx") && !f.endsWith(".js") && !f.endsWith(".jsx"))) {
    return "build";
  }

  // Style-only changes
  const hasStyleFiles = allFiles.some(
    (f) => f.endsWith(".css") || f.endsWith(".scss") || f.endsWith(".less")
  );
  if (hasStyleFiles && allFiles.every((f) => f.endsWith(".css") || f.endsWith(".scss") || f.endsWith(".less"))) {
    return "style";
  }

  // Bug fix detection
  const fixIndicators = [
    "fix",
    "bug",
    "patch",
    "resolve",
    "issue",
    "error",
    "crash",
    "broken",
    "incorrect",
    "wrong",
  ];
  const hasFixIndicators = fixIndicators.some(
    (indicator) =>
      allAddedContent.includes(indicator) || allRemovedContent.includes(indicator)
  );

  // If mostly deletions/modifications and fix indicators
  if (hasFixIndicators && stats.deletions > 0) {
    return "fix";
  }

  // Performance
  if (
    allAddedContent.includes("memo") ||
    allAddedContent.includes("usecallback") ||
    allAddedContent.includes("usememo") ||
    allAddedContent.includes("lazy") ||
    allAddedContent.includes("cache") ||
    allAddedContent.includes("optimize")
  ) {
    return "perf";
  }

  // New feature (new files, mostly additions)
  if (stats.newFiles.length > 0 && stats.additions > stats.deletions * 2) {
    return "feat";
  }

  // Refactoring (similar additions/deletions, no new files)
  if (
    stats.newFiles.length === 0 &&
    stats.deletedFiles.length === 0 &&
    stats.additions > 0 &&
    stats.deletions > 0 &&
    Math.abs(stats.additions - stats.deletions) < Math.max(stats.additions, stats.deletions) * 0.5
  ) {
    return "refactor";
  }

  // Default to feat for additions, fix for other
  if (stats.additions > stats.deletions) return "feat";
  return "fix";
}

function describeChanges(stats: DiffStats, hunks: DiffHunk[]): string {
  const parts: string[] = [];

  // Describe file-level changes
  if (stats.newFiles.length > 0) {
    if (stats.newFiles.length === 1) {
      parts.push(`add ${simplifyPath(stats.newFiles[0])}`);
    } else {
      parts.push(`add ${stats.newFiles.length} new files`);
    }
  }

  if (stats.deletedFiles.length > 0) {
    if (stats.deletedFiles.length === 1) {
      parts.push(`remove ${simplifyPath(stats.deletedFiles[0])}`);
    } else {
      parts.push(`remove ${stats.deletedFiles.length} files`);
    }
  }

  if (stats.renamedFiles.length > 0) {
    parts.push(`rename ${stats.renamedFiles.length} file(s)`);
  }

  // Describe content changes
  if (stats.modifiedFiles.length > 0 && parts.length === 0) {
    const addedContent = hunks.flatMap((h) => h.addedLines);

    // Detect specific patterns in added content
    const addedFunctions = addedContent.filter(
      (l) => l.match(/^(export\s+)?(async\s+)?function\s/) || l.match(/^(export\s+)?const\s+\w+\s*=/)
    );
    const addedImports = addedContent.filter((l) => l.startsWith("import "));
    const addedComponents = addedContent.filter((l) =>
      /^(export\s+)?(default\s+)?function\s+[A-Z]/.test(l)
    );

    if (addedComponents.length > 0) {
      const name = addedComponents[0].match(/function\s+(\w+)/)?.[1];
      parts.push(`update ${name || "component"}`);
    } else if (addedFunctions.length > 0) {
      const name = addedFunctions[0].match(/(?:function|const)\s+(\w+)/)?.[1];
      parts.push(`update ${name || "function"} logic`);
    } else if (addedImports.length > 0 && addedContent.length === addedImports.length) {
      parts.push("update imports");
    } else if (stats.modifiedFiles.length === 1) {
      parts.push(`update ${simplifyPath(stats.modifiedFiles[0])}`);
    } else {
      parts.push(`update ${stats.modifiedFiles.length} files`);
    }
  }

  return parts.join(", ");
}

function simplifyPath(filePath: string): string {
  const parts = filePath.split("/");
  const fileName = parts[parts.length - 1];

  // Remove common prefixes
  const name = fileName
    .replace(/\.(tsx?|jsx?|css|scss|json|md)$/, "")
    .replace(/\.module$/, "")
    .replace(/\.test$/, "")
    .replace(/\.spec$/, "");

  return name;
}

function truncateToLimit(message: string, limit: number): string {
  if (message.length <= limit) return message;

  // Try to cut at last word boundary before limit
  const truncated = message.slice(0, limit - 3);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > limit * 0.5) {
    return truncated.slice(0, lastSpace) + "...";
  }

  return truncated + "...";
}

export function generateCommitMessage(diff: string): string {
  if (!diff.trim()) {
    return "chore: empty commit";
  }

  const { stats, hunks } = parseDiff(diff);

  if (stats.filesChanged.length === 0) {
    return "chore: minor changes";
  }

  const type = detectCommitType(stats, hunks);
  const description = describeChanges(stats, hunks);

  const subject = `${type}: ${description}`;
  return truncateToLimit(subject, 72);
}
