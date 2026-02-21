/**
 * Generate an import map for the preview iframe.
 *
 * Always includes React 19.2.3 core packages.
 * All other externals are resolved via esm.sh with ?external=react,react-dom
 * to prevent duplicate React instances (which break hooks).
 */

const REACT_VERSION = "19.2.3";

const ALWAYS_INCLUDED: Record<string, string> = {
  react: `https://esm.sh/react@${REACT_VERSION}`,
  "react/": `https://esm.sh/react@${REACT_VERSION}/`,
  "react-dom": `https://esm.sh/react-dom@${REACT_VERSION}`,
  "react-dom/": `https://esm.sh/react-dom@${REACT_VERSION}/`,
};

/** Packages that should also be externalized from esm.sh to avoid duplicates */
const EXTERNAL_PEER = "react,react-dom";

function esmShUrl(pkg: string): string {
  // Don't add external query to react packages themselves
  if (pkg === "react" || pkg === "react-dom") {
    return `https://esm.sh/${pkg}@${REACT_VERSION}`;
  }
  return `https://esm.sh/${pkg}?external=${EXTERNAL_PEER}`;
}

export interface ImportMap {
  imports: Record<string, string>;
}

export function generateImportMap(externals: string[]): ImportMap {
  const imports: Record<string, string> = { ...ALWAYS_INCLUDED };

  for (const pkg of externals) {
    // Skip react/react-dom (already handled above)
    if (pkg === "react" || pkg === "react-dom") continue;

    // Add exact match
    if (!imports[pkg]) {
      imports[pkg] = esmShUrl(pkg);
    }

    // Add subpath mapping (e.g. "lucide-react/" → esm.sh/lucide-react/?external=...)
    // This allows imports like "lucide-react/dist/esm/icons/check"
    const subpathKey = `${pkg}/`;
    if (!imports[subpathKey]) {
      imports[subpathKey] = `https://esm.sh/${pkg}/?external=${EXTERNAL_PEER}&path=/`;
    }
  }

  return { imports };
}
