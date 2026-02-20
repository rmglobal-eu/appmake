export interface FileAction {
  type: "file";
  filePath: string;
  content: string;
}

export interface ShellAction {
  type: "shell";
  command: string;
}

export interface StartAction {
  type: "start";
  command: string;
}

export type Action = FileAction | ShellAction | StartAction;

export interface ActionState {
  action: Action;
  status: "pending" | "running" | "completed" | "error";
  output?: string;
  error?: string;
}
