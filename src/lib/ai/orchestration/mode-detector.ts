export function extractUserQuery(message: string): string {
  if (!message) return "";

  let query = message;

  // Case 1: Combined format from frontend send: "userPrompt\n\n[Attachment: filename]\nfileContent"
  if (query.includes("\n\n[Attachment:")) {
    query = query.split("\n\n[Attachment:")[0];
  }

  // Case 2: DB loaded format: "[File: filename] userPrompt"
  const dbFileMatch = query.match(/^\[File:\s*[^\]]+\]\s*([\s\S]*)/);
  if (dbFileMatch) {
    query = dbFileMatch[1];
  }

  return query.trim();
}

export function isStopCommand(message: string): boolean {
  const query = extractUserQuery(message);
  return /^(stop|exit|quit|end quiz|end|stop quiz)$/i.test(query);
}
