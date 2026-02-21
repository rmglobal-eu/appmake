/**
 * Mock data factories for testing.
 * Provides pre-built mock objects for files, API responses, sessions, and streams.
 */

/**
 * Create a sample React project file set with App, index, and styles.
 */
export function createMockFiles(): Record<string, string> {
  return {
    "App.tsx": `import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to AppMake
      </h1>
      <p className="text-gray-600 mb-8">
        You have clicked the button {count} times.
      </p>
      <button
        onClick={() => setCount((c) => c + 1)}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Click me
      </button>
    </div>
  );
}`,
    "index.tsx": `import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);`,
    "index.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,
    "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AppMake Preview</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
    "package.json": JSON.stringify(
      {
        name: "appmake-preview",
        version: "1.0.0",
        private: true,
        dependencies: {
          react: "^19.0.0",
          "react-dom": "^19.0.0",
        },
        devDependencies: {
          typescript: "^5.6.0",
          "@types/react": "^19.0.0",
          "@types/react-dom": "^19.0.0",
        },
      },
      null,
      2
    ),
    "tsconfig.json": JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          lib: ["DOM", "DOM.Iterable", "ES2020"],
          jsx: "react-jsx",
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
        },
        include: ["**/*.ts", "**/*.tsx"],
      },
      null,
      2
    ),
  };
}

/**
 * Create a mock Response object that mimics the Fetch API Response.
 */
export function createMockApiResponse(overrides?: {
  status?: number;
  statusText?: string;
  body?: unknown;
  headers?: Record<string, string>;
}): Response {
  const {
    status = 200,
    statusText = "OK",
    body = { success: true },
    headers = { "Content-Type": "application/json" },
  } = overrides ?? {};

  const jsonBody = JSON.stringify(body);

  return new Response(jsonBody, {
    status,
    statusText,
    headers: new Headers(headers),
  });
}

/**
 * Create a mock session object matching NextAuth session shape.
 */
export function createMockSession(): {
  user: { id: string; name: string; email: string; image?: string };
} {
  return {
    user: {
      id: "user_mock_123456",
      name: "Test User",
      email: "testuser@example.com",
      image: "https://avatars.example.com/default.png",
    },
  };
}

/**
 * Create a mock ReadableStream that yields the given content in chunks.
 * Useful for testing streaming AI responses.
 */
export function createMockStream(content: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  // Split content into chunks of ~20 characters to simulate streaming
  const chunkSize = 20;
  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }

  let index = 0;

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });
}
