export interface UpdateCardSubtask {
  id: string;
  label: string;
  type: "file" | "shell" | "start";
  filePath?: string;
  status: "streaming" | "completed";
}

export interface UpdateCard {
  id: string;
  artifactId: string;
  title: string;
  subtasks: UpdateCardSubtask[];
  status: "streaming" | "completed";
  previousFiles: Record<string, string>;
  filesCreated: number;
  filesModified: number;
  createdAt: number;
}
