import { getDockerClient } from "./docker-manager";
import type { ExecResult } from "@/types/sandbox";

const MAX_COMMAND_LENGTH = 4096;

const BLOCKED_PATTERNS = [
  /:(){ :|:& };:/,                    // fork bomb
  /\brm\s+(-[a-zA-Z]*)?.*\s+\/\s*$/,  // rm -rf /
  /\brm\s+(-[a-zA-Z]*f[a-zA-Z]*)\s+\//, // rm -rf /
  /\bmkfs\b/,                          // format filesystem
  /\bdd\s+.*of=\/dev\//,              // overwrite device
  />\s*\/dev\/sd[a-z]/,               // redirect to block device
  /\bshutdown\b/,                     // shutdown
  /\breboot\b/,                       // reboot
  /\bhalt\b/,                         // halt
  /\bcurl\b.*\|\s*\bbash\b/,         // pipe curl to bash
  /\bwget\b.*\|\s*\bbash\b/,         // pipe wget to bash
];

function sanitizeCommand(command: string): string {
  if (command.length > MAX_COMMAND_LENGTH) {
    throw new Error(`Command exceeds max length of ${MAX_COMMAND_LENGTH} characters`);
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error("Command blocked by security policy");
    }
  }

  return command;
}

/**
 * Execute a command in a container and return stdout/stderr.
 */
export async function exec(
  containerId: string,
  command: string
): Promise<ExecResult> {
  command = sanitizeCommand(command);

  const docker = getDockerClient();
  const container = docker.getContainer(containerId);

  const execInstance = await container.exec({
    Cmd: ["bash", "-c", command],
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
  });

  const stream = await execInstance.start({ hijack: true, stdin: false });

  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";

    // Docker multiplexes stdout/stderr into a single stream with headers
    docker.modem.demuxStream(
      stream,
      {
        write(chunk: Buffer) {
          stdout += chunk.toString();
        },
      } as NodeJS.WritableStream,
      {
        write(chunk: Buffer) {
          stderr += chunk.toString();
        },
      } as NodeJS.WritableStream
    );

    stream.on("end", async () => {
      try {
        const inspect = await execInstance.inspect();
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: inspect.ExitCode ?? 0,
        });
      } catch {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 });
      }
    });

    stream.on("error", reject);
  });
}

/**
 * Create an interactive PTY exec session (for terminal).
 * Returns the duplex stream.
 */
export async function execPty(containerId: string) {
  const docker = getDockerClient();
  const container = docker.getContainer(containerId);

  const execInstance = await container.exec({
    Cmd: ["bash"],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
  });

  const stream = await execInstance.start({
    hijack: true,
    stdin: true,
    Tty: true,
  });

  return stream;
}
