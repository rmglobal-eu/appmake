export interface FileAction {
  type: "file";
  filePath: string;
  content: string;
}

export interface SearchReplaceAction {
  type: "search-replace";
  filePath: string;
  searchBlock: string;
  replaceBlock: string;
}

export interface ShellAction {
  type: "shell";
  command: string;
}

export interface StartAction {
  type: "start";
  command: string;
}

export type Action = FileAction | SearchReplaceAction | ShellAction | StartAction;

export interface ActionState {
  action: Action;
  status: "pending" | "running" | "completed" | "error";
  output?: string;
  error?: string;
}
