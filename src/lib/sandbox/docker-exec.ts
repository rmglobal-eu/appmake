import { getDockerClient } from "./docker-manager";
import type { ExecResult } from "@/types/sandbox";

/**
 * Execute a command in a container and return stdout/stderr.
 */
export async function exec(
  containerId: string,
  command: string
): Promise<ExecResult> {
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
