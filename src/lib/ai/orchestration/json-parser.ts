export function extractAndParseJSON(content: string): unknown {
  let cleanContent = content.trim();

  // 1. Remove markdown code fences if present (e.g. ```json or ```)
  const codeBlockRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
  const match = cleanContent.match(codeBlockRegex);
  if (match) {
    cleanContent = match[1].trim();
  }

  // 2. Locate first '{' and last '}' to strip extra text before/after
  const startIdx = cleanContent.indexOf("{");
  const endIdx = cleanContent.lastIndexOf("}");

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    try {
      const jsonCandidate = cleanContent.slice(startIdx, endIdx + 1);
      return JSON.parse(jsonCandidate);
    } catch {
      // Fall through to standard parsing if slice fails
    }
  }

  // Perform minimal non-destructive cleanup ONLY if direct JSON parsing fails.
  try {
    return JSON.parse(cleanContent);
  } catch (error) {
    // Attempt minor, non-destructive replacement of unescaped control chars if parsing failed
    try {
      const sanitized = cleanContent.replace(/[\u0000-\u001F\u007F-\u009F]/g, (char) => {
        if (char === "\n") return "\\n";
        if (char === "\r") return "\\r";
        if (char === "\t") return "\\t";
        return "";
      });
      return JSON.parse(sanitized);
    } catch {
      // If cleanup also fails, throw the original error to fail gracefully or propagate
      throw error;
    }
  }
}
