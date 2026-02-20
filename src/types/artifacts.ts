import type { Action } from "./actions";

export interface Artifact {
  id: string;
  title: string;
  actions: Action[];
  closed: boolean;
}

export interface ArtifactState extends Artifact {
  currentActionIndex: number;
  status: "streaming" | "executing" | "completed" | "error";
}
