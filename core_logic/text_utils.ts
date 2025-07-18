export function removeJsonMarkdown(text: string) {
  text = text.trim();
  if (text.startsWith("```json")) {
    text = text.slice(7);
  } else if (text.startsWith("json")) {
    text = text.slice(4);
  } else if (text.startsWith("```")) {
    text = text.slice(3);
  }
  if (text.endsWith("```")) {
    text = text.slice(0, -3);
  }
  return text.trim();
}

export class ThinkTagStreamProcessor {
  private buffer: string = "";
  private hasSkippedThinkBlock: boolean = false;

  processChunk(
    chunk: string,
    contentOutput: (data: string) => void,
    thinkingOutput?: (data: string) => void
  ): void {
    if (this.hasSkippedThinkBlock) {
      contentOutput(chunk);
      return;
    }

    this.buffer += chunk;

    const startTag = this.buffer.startsWith("<think>");
    const endTagIndex = this.buffer.indexOf("</think>");

    if (startTag) {
      if (endTagIndex !== -1) {
        const contentAfterThink = this.buffer.substring(
          endTagIndex + "</think>".length
        );

        if (contentAfterThink.length > 0) {
          contentOutput(contentAfterThink);
        }

        this.hasSkippedThinkBlock = true;
        this.buffer = "";
      } else {
        if (thinkingOutput) thinkingOutput(chunk);
      }
    } else {
      this.hasSkippedThinkBlock = true;
      contentOutput(chunk);
    }
  }
  end(): void {
    this.buffer = "";
    this.hasSkippedThinkBlock = false;
  }
}