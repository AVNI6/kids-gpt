"use client";

export const getUniqueStoragePath = (
  userId: string,
  sessionId: string,
  ext: string,
  kind: "image" | "pdf" | "doc" = "doc"
) => {
  return `${userId}/${sessionId}_${kind}_${Date.now()}.${ext}`;
};

export const cleanFileName = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 30);
};
