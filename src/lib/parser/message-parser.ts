import type { Action } from "@/types/actions";
import type { ParserCallbacks } from "./types";

/**
 * Streaming XML parser for LLM responses.
 * Parses <artifact> and <action> tags from incomplete streaming chunks.
 *
 * State machine:
 *   text -> opening_tag -> artifact_body -> action_body -> ...
 */
export class MessageParser {
  private buffer = "";
  private state: "text" | "tag" | "artifact" | "action" | "plan" | "suggestions" = "text";
  private currentArtifactId = "";
  private currentArtifactTitle = "";
  private currentActionType = "";
  private currentActionFilePath = "";
  private actionContent = "";
  private planContent = "";
  private suggestionsContent = "";
  private callbacks: ParserCallbacks;
  private textBuffer = "";

  constructor(callbacks: ParserCallbacks) {
    this.callbacks = callbacks;
  }

  push(chunk: string) {
    this.buffer += chunk;
    this.process();
  }

  end() {
    // Flush any remaining buffer content (e.g., incomplete tags) as plain text
    if (this.buffer) {
      this.callbacks.onText?.(this.buffer);
      this.buffer = "";
    }
    this.textBuffer = "";
  }

  private process() {
    while (this.buffer.length > 0) {
      switch (this.state) {
        case "text":
          if (!this.processText()) return;
          break;
        case "tag":
          if (!this.processTag()) return;
          break;
        case "artifact":
          if (!this.processArtifact()) return;
          break;
        case "action":
          if (!this.processAction()) return;
          break;
        case "plan":
          if (!this.processPlan()) return;
          break;
        case "suggestions":
          if (!this.processSuggestions()) return;
          break;
      }
    }
  }

  private processText(): boolean {
    const tagStart = this.buffer.indexOf("<");

    if (tagStart === -1) {
      this.textBuffer += this.buffer;
      this.callbacks.onText?.(this.buffer);
      this.buffer = "";
      return false;
    }

    if (tagStart > 0) {
      const text = this.buffer.slice(0, tagStart);
      this.textBuffer += text;
      this.callbacks.onText?.(text);
      this.buffer = this.buffer.slice(tagStart);
    }

    this.state = "tag";
    return true;
  }

  private processTag(): boolean {
    // Check for <artifact
    const artifactMatch = this.buffer.match(
      /^<artifact\s+title="([^"]*?)"\s+id="([^"]*?)"\s*>/
    );
    if (artifactMatch) {
      this.currentArtifactTitle = artifactMatch[1];
      this.currentArtifactId = artifactMatch[2];
      this.buffer = this.buffer.slice(artifactMatch[0].length);
      this.state = "artifact";
      this.callbacks.onArtifactOpen?.({
        id: this.currentArtifactId,
        title: this.currentArtifactTitle,
      });
      return true;
    }

    // Check for </artifact>
    if (this.buffer.startsWith("</artifact>")) {
      this.buffer = this.buffer.slice("</artifact>".length);
      this.callbacks.onArtifactClose?.(this.currentArtifactId);
      this.currentArtifactId = "";
      this.currentArtifactTitle = "";
      this.state = "text";
      return true;
    }

    // Check for <action type="file"
    const actionFileMatch = this.buffer.match(
      /^<action\s+type="(file)"\s+filePath="([^"]*?)"\s*>/
    );
    if (actionFileMatch) {
      this.currentActionType = actionFileMatch[1];
      this.currentActionFilePath = actionFileMatch[2];
      this.actionContent = "";
      this.buffer = this.buffer.slice(actionFileMatch[0].length);
      this.state = "action";
      const action: Action = {
        type: "file",
        filePath: this.currentActionFilePath,
        content: "",
      };
      this.callbacks.onActionOpen?.(this.currentArtifactId, action);
      return true;
    }

    // Check for <action type="search-replace"
    const actionSearchReplaceMatch = this.buffer.match(
      /^<action\s+type="(search-replace)"\s+filePath="([^"]*?)"\s*>/
    );
    if (actionSearchReplaceMatch) {
      this.currentActionType = actionSearchReplaceMatch[1];
      this.currentActionFilePath = actionSearchReplaceMatch[2];
      this.actionContent = "";
      this.buffer = this.buffer.slice(actionSearchReplaceMatch[0].length);
      this.state = "action";
      const action: Action = {
        type: "search-replace",
        filePath: this.currentActionFilePath,
        searchBlock: "",
        replaceBlock: "",
      };
      this.callbacks.onActionOpen?.(this.currentArtifactId, action);
      return true;
    }

    const actionSimpleMatch = this.buffer.match(
      /^<action\s+type="(shell|start)"\s*>/
    );
    if (actionSimpleMatch) {
      this.currentActionType = actionSimpleMatch[1];
      this.currentActionFilePath = "";
      this.actionContent = "";
      this.buffer = this.buffer.slice(actionSimpleMatch[0].length);
      this.state = "action";
      const action: Action =
        this.currentActionType === "shell"
          ? { type: "shell", command: "" }
          : { type: "start", command: "" };
      this.callbacks.onActionOpen?.(this.currentArtifactId, action);
      return true;
    }

    // Check for <plan
    const planMatch = this.buffer.match(
      /^<plan\s+title="([^"]*?)"\s*>/
    );
    if (planMatch) {
      this.planContent = "";
      this.buffer = this.buffer.slice(planMatch[0].length);
      this.state = "plan";
      this.callbacks.onPlanOpen?.({ title: planMatch[1] });
      return true;
    }

    // Check for </plan>
    if (this.buffer.startsWith("</plan>")) {
      this.buffer = this.buffer.slice("</plan>".length);
      this.callbacks.onPlanClose?.();
      this.planContent = "";
      this.state = "text";
      return true;
    }

    // Check for <tool-activity ... /> (self-closing)
    const toolActivityMatch = this.buffer.match(
      /^<tool-activity\s+name="([^"]*?)"\s+status="([^"]*?)"(?:\s+args="([^"]*?)")?(?:\s+result="([^"]*?)")?\s*\/>/
    );
    if (toolActivityMatch) {
      this.buffer = this.buffer.slice(toolActivityMatch[0].length);
      // Skip trailing newline if present
      if (this.buffer.startsWith("\n")) {
        this.buffer = this.buffer.slice(1);
      }
      this.callbacks.onToolActivity?.({
        name: toolActivityMatch[1],
        status: toolActivityMatch[2] as "calling" | "complete" | "error",
        args: toolActivityMatch[3]?.replace(/&quot;/g, '"'),
        result: toolActivityMatch[4]?.replace(/&quot;/g, '"'),
      });
      this.state = "text";
      return true;
    }

    // Check for <suggestions>
    if (this.buffer.startsWith("<suggestions>")) {
      this.suggestionsContent = "";
      this.buffer = this.buffer.slice("<suggestions>".length);
      this.state = "suggestions";
      return true;
    }

    // Check for </suggestions>
    if (this.buffer.startsWith("</suggestions>")) {
      this.buffer = this.buffer.slice("</suggestions>".length);
      const lines = this.suggestionsContent.split("\n");
      const suggestions = lines
        .map((l) => l.replace(/^[\s-]*/, "").trim())
        .filter((l) => l.length > 0);
      this.callbacks.onSuggestionsClose?.(suggestions);
      this.suggestionsContent = "";
      this.state = "text";
      return true;
    }

    // Check for </action>
    if (this.buffer.startsWith("</action>")) {
      this.buffer = this.buffer.slice("</action>".length);
      const action = this.buildAction();
      this.callbacks.onActionClose?.(this.currentArtifactId, action);
      this.currentActionType = "";
      this.currentActionFilePath = "";
      this.actionContent = "";
      this.state = "artifact";
      return true;
    }

    // If buffer starts with < but doesn't match any known tag,
    // it might be an incomplete tag. Wait for more data unless
    // we can determine it's not a tag.
    if (this.buffer.startsWith("<")) {
      // If we have enough buffer to know it's not a known tag
      if (this.buffer.length > 100) {
        // Not a recognized tag — emit as text
        const char = this.buffer[0];
        this.textBuffer += char;
        this.callbacks.onText?.(char);
        this.buffer = this.buffer.slice(1);
        this.state = "text";
        return true;
      }
      // Wait for more data
      return false;
    }

    this.state = "text";
    return true;
  }

  private processArtifact(): boolean {
    const tagStart = this.buffer.indexOf("<");
    if (tagStart === -1) {
      // No tags, just whitespace/text between actions
      this.buffer = "";
      return false;
    }

    // Skip whitespace/text before next tag
    this.buffer = this.buffer.slice(tagStart);
    this.state = "tag";
    return true;
  }

  private processAction(): boolean {
    const closingTagIndex = this.buffer.indexOf("</action>");
    if (closingTagIndex === -1) {
      // No closing tag yet — buffer everything as content
      this.actionContent += this.buffer;
      this.callbacks.onActionStream?.(this.currentArtifactId, this.buffer);
      this.buffer = "";
      return false;
    }

    // Found closing tag
    const content = this.buffer.slice(0, closingTagIndex);
    this.actionContent += content;
    if (content) {
      this.callbacks.onActionStream?.(this.currentArtifactId, content);
    }
    this.buffer = this.buffer.slice(closingTagIndex);
    this.state = "tag";
    return true;
  }

  private processPlan(): boolean {
    const closingTagIndex = this.buffer.indexOf("</plan>");
    if (closingTagIndex === -1) {
      this.planContent += this.buffer;
      this.callbacks.onPlanContent?.(this.buffer);
      this.buffer = "";
      return false;
    }

    const content = this.buffer.slice(0, closingTagIndex);
    this.planContent += content;
    if (content) {
      this.callbacks.onPlanContent?.(content);
    }
    this.buffer = this.buffer.slice(closingTagIndex);
    this.state = "tag";
    return true;
  }

  private processSuggestions(): boolean {
    const closingTagIndex = this.buffer.indexOf("</suggestions>");
    if (closingTagIndex === -1) {
      this.suggestionsContent += this.buffer;
      this.buffer = "";
      return false;
    }

    const content = this.buffer.slice(0, closingTagIndex);
    this.suggestionsContent += content;
    this.buffer = this.buffer.slice(closingTagIndex);
    this.state = "tag";
    return true;
  }

  private buildAction(): Action {
    const content = this.actionContent.trim();
    switch (this.currentActionType) {
      case "file":
        return {
          type: "file",
          filePath: this.currentActionFilePath,
          content,
        };
      case "search-replace": {
        // Parse <<<SEARCH ... === ... >>> format
        const searchMatch = content.match(/<<<SEARCH\n([\s\S]*?)\n===\n([\s\S]*?)\n>>>/);
        if (searchMatch) {
          return {
            type: "search-replace",
            filePath: this.currentActionFilePath,
            searchBlock: searchMatch[1],
            replaceBlock: searchMatch[2],
          };
        }
        // Fallback: treat as file action if format doesn't match
        return {
          type: "file",
          filePath: this.currentActionFilePath,
          content,
        };
      }
      case "shell":
        return { type: "shell", command: content };
      case "start":
        return { type: "start", command: content };
      default:
        return { type: "shell", command: content };
    }
  }
}
