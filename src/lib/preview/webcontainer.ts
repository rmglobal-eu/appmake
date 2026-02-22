import { WebContainer } from "@webcontainer/api";

let instance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;
let supported = true;
let devServerProcess: { kill: () => void } | null = null;

const BOOT_TIMEOUT = 15_000;
const INSTALL_TIMEOUT = 120_000;
const SERVER_START_TIMEOUT = 30_000;

/**
 * Check if WebContainers are supported in this browser.
 * Requires SharedArrayBuffer (needs COOP/COEP headers).
 */
export function isSupported(): boolean {
  if (!supported) return false;
  if (typeof window === "undefined") return false;
  return typeof SharedArrayBuffer !== "undefined";
}

/**
 * Boot or return the singleton WebContainer instance.
 * Only one instance is allowed per origin.
 */
export async function getWebContainer(): Promise<WebContainer> {
  if (instance) return instance;
  if (bootPromise) return bootPromise;

  bootPromise = new Promise<WebContainer>(async (resolve, reject) => {
    const timer = setTimeout(() => {
      supported = false;
      bootPromise = null;
      reject(new Error("WebContainer boot timed out"));
    }, BOOT_TIMEOUT);

    try {
      const wc = await WebContainer.boot();
      clearTimeout(timer);
      instance = wc;
      resolve(wc);
    } catch (err) {
      clearTimeout(timer);
      supported = false;
      bootPromise = null;
      reject(err);
    }
  });

  return bootPromise;
}

/**
 * Mount a complete FileSystemTree into the WebContainer.
 * Overwrites all existing files.
 */
export async function mountProject(
  tree: import("@webcontainer/api").FileSystemTree
): Promise<void> {
  const wc = await getWebContainer();
  await wc.mount(tree);
}

/**
 * Write a single file. Used for HMR updates during streaming.
 */
export async function writeFile(
  path: string,
  content: string
): Promise<void> {
  const wc = await getWebContainer();
  // Ensure parent directories exist by writing the file
  // WebContainer.fs.writeFile creates intermediate dirs
  await wc.fs.writeFile(path, content);
}

/**
 * Run `npm install` inside the WebContainer.
 * Returns the exit code (0 = success).
 */
export async function runInstall(
  onOutput: (line: string) => void
): Promise<number> {
  const wc = await getWebContainer();

  const process = await wc.spawn("npm", ["install", "--prefer-offline"]);

  // Pipe output
  process.output.pipeTo(
    new WritableStream({
      write(chunk) {
        onOutput(chunk);
      },
    })
  );

  const exitCode = await Promise.race([
    process.exit,
    new Promise<number>((_, reject) =>
      setTimeout(
        () => reject(new Error("npm install timed out")),
        INSTALL_TIMEOUT
      )
    ),
  ]);

  return exitCode;
}

/**
 * Start the Vite dev server.
 * Calls `onReady` with port and URL when the server is listening.
 */
export async function startDevServer(
  onOutput: (line: string) => void,
  onReady: (port: number, url: string) => void
): Promise<void> {
  const wc = await getWebContainer();

  // Kill existing dev server if running
  await stopDevServer();

  const process = await wc.spawn("npm", ["run", "dev"]);
  devServerProcess = process;

  process.output.pipeTo(
    new WritableStream({
      write(chunk) {
        onOutput(chunk);
      },
    })
  );

  // Wait for the server-ready event from WebContainer
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Dev server start timed out"));
    }, SERVER_START_TIMEOUT);

    wc.on("server-ready", (port, url) => {
      clearTimeout(timer);
      onReady(port, url);
      resolve();
    });
  });
}

/**
 * Stop the currently running dev server process.
 */
export async function stopDevServer(): Promise<void> {
  if (devServerProcess) {
    try {
      devServerProcess.kill();
    } catch {
      // Process may already be dead
    }
    devServerProcess = null;
  }
}

/**
 * Tear down the dev server (call on project switch).
 */
export async function teardown(): Promise<void> {
  await stopDevServer();
}
