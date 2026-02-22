import type { Action } from "@/types/actions";
import type { Artifact } from "@/types/artifacts";

export interface ToolActivity {
  name: string;
  status: "calling" | "complete" | "error";
  args?: string;
  result?: string;
}

export interface InterviewQuestion {
  id: string;
  type: "choice" | "text";
  text: string;
  options?: Array<{ value: string; label: string }>;
}

export interface InterviewData {
  title: string;
  questions: InterviewQuestion[];
}

export interface ParserCallbacks {
  onText?: (text: string) => void;
  onArtifactOpen?: (artifact: { id: string; title: string }) => void;
  onArtifactClose?: (artifactId: string) => void;
  onActionOpen?: (artifactId: string, action: Action) => void;
  onActionStream?: (artifactId: string, content: string) => void;
  onActionClose?: (artifactId: string, action: Action) => void;
  onPlanOpen?: (plan: { title: string }) => void;
  onPlanContent?: (content: string) => void;
  onPlanClose?: () => void;
  onSuggestionsClose?: (suggestions: string[]) => void;
  onToolActivity?: (activity: ToolActivity) => void;
  onInterviewClose?: (interview: InterviewData) => void;
}

export type ParserState =
  | "text"
  | "opening_tag"
  | "artifact_body"
  | "action_body"
  | "closing_tag";

export interface ParsedArtifact extends Artifact {
  textBefore: string;
}
