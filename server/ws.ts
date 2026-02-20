import { WebSocketServer, WebSocket } from "ws";
import Docker from "dockerode";
import type { IncomingMessage } from "http";

const PORT = parseInt(process.env.WS_PORT || "3001", 10);
const docker = new Docker({
  socketPath: process.env.DOCKER_HOST || "/var/run/docker.sock",
});

const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server running on port ${PORT}`);

wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
  const url = new URL(req.url || "", `http://localhost:${PORT}`);
  const sessionId = url.searchParams.get("session");
  const containerId = url.searchParams.get("container");
  const type = url.searchParams.get("type") || "terminal"; // terminal | sync

  if (!containerId) {
    ws.close(1008, "container parameter required");
    return;
  }

  if (type === "terminal") {
    await handleTerminal(ws, containerId);
  } else if (type === "sync") {
    handleFileSync(ws, containerId);
  }
});

async function handleTerminal(ws: WebSocket, containerId: string) {
  try {
    const container = docker.getContainer(containerId);

    const exec = await container.exec({
      Cmd: ["bash"],
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
    });

    const stream = await exec.start({
      hijack: true,
      stdin: true,
      Tty: true,
    });

    // Container -> WebSocket
    stream.on("data", (chunk: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(chunk);
      }
    });

    // WebSocket -> Container
    ws.on("message", (data: Buffer) => {
      stream.write(data);
    });

    stream.on("end", () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, "Container stream ended");
      }
    });

    ws.on("close", () => {
      stream.destroy();
    });
  } catch (error) {
    console.error("Terminal error:", error);
    ws.close(1011, "Failed to attach to container");
  }
}

function handleFileSync(ws: WebSocket, containerId: string) {
  // File sync: receive file change events from editor, apply to container
  ws.on("message", async (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === "write") {
        const container = docker.getContainer(containerId);
        const { Readable } = await import("stream");
        const { pack } = await import("tar-stream");
        const tarPack = pack();

        const fileName = msg.path.split("/").pop();
        const dir = msg.path.substring(0, msg.path.lastIndexOf("/"));

        tarPack.entry({ name: fileName }, msg.content);
        tarPack.finalize();

        await container.putArchive(tarPack, { path: dir || "/workspace" });

        ws.send(
          JSON.stringify({ type: "ack", path: msg.path, success: true })
        );
      }

      if (msg.type === "list") {
        // Execute find to list files
        const container = docker.getContainer(containerId);
        const execInst = await container.exec({
          Cmd: [
            "find",
            msg.path || "/workspace",
            "-maxdepth",
            "5",
            "-not",
            "-path",
            "*/node_modules/*",
            "-not",
            "-path",
            "*/.git/*",
          ],
          AttachStdout: true,
          AttachStderr: true,
        });

        const stream = await execInst.start({ hijack: true, stdin: false });
        let output = "";
        stream.on("data", (chunk: Buffer) => {
          output += chunk.toString();
        });
        stream.on("end", () => {
          ws.send(JSON.stringify({ type: "files", data: output.trim() }));
        });
      }
    } catch (error) {
      console.error("File sync error:", error);
    }
  });
}
