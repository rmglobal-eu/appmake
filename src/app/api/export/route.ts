import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { projectFiles, projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyProjectOwnership } from "@/lib/auth/ownership";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, platform, files: clientFiles } = (await req.json()) as {
    projectId: string;
    platform: "ios" | "android" | "both";
    files?: Record<string, string>;
  };

  const owns = await verifyProjectOwnership(projectId, session.user.id);
  if (!owns) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });

  // Use client-provided files first, fall back to DB
  let files: Record<string, string> | null = null;
  if (clientFiles && Object.keys(clientFiles).length > 0) {
    files = clientFiles;
  } else {
    const filesRow = await db.query.projectFiles.findFirst({
      where: eq(projectFiles.projectId, projectId),
    });
    if (filesRow) {
      files = JSON.parse(filesRow.files);
    }
  }

  if (!files || Object.keys(files).length === 0) {
    return NextResponse.json({ error: "No files to export" }, { status: 400 });
  }
  const appName = project?.name || "MyApp";
  const appId = `com.appmake.${appName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;

  // Generate Capacitor config and wrapper files
  const exportFiles: Record<string, string> = {};

  // package.json
  exportFiles["package.json"] = JSON.stringify({
    name: appName.toLowerCase().replace(/\s+/g, "-"),
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "vite",
      build: "vite build",
      "cap:init": `npx cap init "${appName}" "${appId}" --web-dir dist`,
      "cap:add:ios": "npx cap add ios",
      "cap:add:android": "npx cap add android",
      "cap:sync": "npx cap sync",
      "cap:open:ios": "npx cap open ios",
      "cap:open:android": "npx cap open android",
      "mobile:build": "npm run build && npm run cap:sync",
    },
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      "@capacitor/core": "^6.0.0",
      "@capacitor/cli": "^6.0.0",
    },
    devDependencies: {
      vite: "^5.0.0",
      "@vitejs/plugin-react": "^4.0.0",
      typescript: "^5.0.0",
    },
  }, null, 2);

  // capacitor.config.ts
  exportFiles["capacitor.config.ts"] = `import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: '${appId}',
  appName: '${appName}',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
`;

  // vite.config.ts
  exportFiles["vite.config.ts"] = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
`;

  // index.html
  exportFiles["index.html"] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${appName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`;

  // main.tsx
  exportFiles["src/main.tsx"] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

  // Copy project files into src/
  for (const [path, content] of Object.entries(files)) {
    exportFiles[`src/${path}`] = content;
  }

  // README with instructions
  exportFiles["README.md"] = `# ${appName} — Mobile App

Exported from Appmake. This project uses Capacitor to wrap your web app as a native mobile app.

## Setup

\`\`\`bash
npm install
${platform === "ios" || platform === "both" ? "npm run cap:add:ios" : ""}
${platform === "android" || platform === "both" ? "npm run cap:add:android" : ""}
\`\`\`

## Build & Run

\`\`\`bash
npm run mobile:build
${platform === "ios" || platform === "both" ? "npm run cap:open:ios  # Opens Xcode" : ""}
${platform === "android" || platform === "both" ? "npm run cap:open:android  # Opens Android Studio" : ""}
\`\`\`
`;

  return NextResponse.json({ files: exportFiles, appName, appId });
}
