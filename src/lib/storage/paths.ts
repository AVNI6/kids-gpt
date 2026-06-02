/**
 * Centralized Path and Naming Structure Module
 *
 * Standardizes filename sanitization, timestamp generation,
 * folder paths, and naming conventions for all buckets.
 */

/**
 * Sanitizes a filename by replacing any non-alphanumeric/standard characters with underscores.
 */
export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Parses a file name to extract the base name and extension safely.
 */
export function parseFileName(fileName: string): { baseName: string; extension: string } {
  const parts = fileName.split(".");
  const extension = parts.length > 1 ? parts.pop() || "png" : "png";
  const baseName = sanitizeFileName(parts.join(".") || "file");
  return { baseName, extension };
}

/**
 * Generates a consistent, unique storage path for user/child avatars.
 * e.g., avatars/${userId}/${timestamp}-${sanitizedFileName}
 */
export function generateAvatarPath(userId: string, fileName: string): string {
  const { baseName, extension } = parseFileName(fileName);
  const timestamp = Date.now();
  return `avatars/${userId}/${timestamp}-${baseName}.${extension}`;
}

/**
 * Generates a consistent, unique storage path for attachments/materials.
 * e.g., materials/${userId}/${timestamp}-${sanitizedFileName}
 */
export function generateAttachmentPath(userId: string, folder: string, fileName: string): string {
  const { baseName, extension } = parseFileName(fileName);
  const timestamp = Date.now();
  // Standardize folder prefix if it's missing or present
  const cleanFolder = folder.replace(/\/+$/, "").trim();
  const folderPath = cleanFolder ? `${cleanFolder}/` : "";
  return `${folderPath}${timestamp}-${baseName}.${extension}`;
}
