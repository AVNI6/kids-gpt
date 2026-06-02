/**
 * Centralized File and Image Validation Module
 *
 * Houses size, MIME-type, and extension-specific check rules
 * for all file uploads in the application.
 */

export interface ValidationOptions {
  maxBytes?: number;
  allowedMimeTypes?: string[];
}

const DEFAULT_AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5MB
const DEFAULT_ATTACHMENT_MAX_BYTES = 50 * 1024 * 1024; // 50MB

/**
 * Validates a generic file against size and MIME type options.
 */
export function validateUploadFile(
  file: File,
  options?: ValidationOptions
): { valid: boolean; error: string | null } {
  if (!file || !(file instanceof File) || file.size === 0) {
    return { valid: false, error: "Please select a valid file." };
  }

  // Check file size
  if (options?.maxBytes && file.size > options.maxBytes) {
    const sizeInMb = (options.maxBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size exceeds the maximum limit of ${sizeInMb}MB.`,
    };
  }

  // Check allowed MIME types
  if (options?.allowedMimeTypes && options.allowedMimeTypes.length > 0) {
    const isAllowed = options.allowedMimeTypes.some((mime) => {
      if (mime.endsWith("/*")) {
        const prefix = mime.split("/")[0];
        return file.type.startsWith(`${prefix}/`);
      }
      return file.type === mime;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: "This file format is not allowed.",
      };
    }
  }

  return { valid: true, error: null };
}

/**
 * Validates that a file is a valid image.
 */
export function validateImageFile(
  file: File,
  options?: Omit<ValidationOptions, "allowedMimeTypes">
): { valid: boolean; error: string | null } {
  return validateUploadFile(file, {
    maxBytes: options?.maxBytes,
    allowedMimeTypes: ["image/*"],
  });
}

/**
 * Specifically validates user and child avatar files.
 */
export function validateAvatarFile(file: File): { valid: boolean; error: string | null } {
  const result = validateImageFile(file, { maxBytes: DEFAULT_AVATAR_MAX_BYTES });
  if (!result.valid && result.error?.includes("format")) {
    return { valid: false, error: "Avatar must be an image file." };
  }
  return result;
}

/**
 * Specifically validates chat messages/classroom attachments.
 */
export function validateAttachmentFile(file: File): { valid: boolean; error: string | null } {
  return validateUploadFile(file, {
    maxBytes: DEFAULT_ATTACHMENT_MAX_BYTES,
    allowedMimeTypes: [
      "image/*",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "text/plain",
    ],
  });
}
