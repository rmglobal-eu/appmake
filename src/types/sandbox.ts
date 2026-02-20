export type SandboxStatus = "creating" | "running" | "stopped" | "destroyed";
export type SandboxTemplate = "node" | "python" | "static";

export interface Sandbox {
  id: string;
  projectId: string;
  containerId: string | null;
  status: SandboxStatus;
  previewPort: number | null;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileEntry[];
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}
