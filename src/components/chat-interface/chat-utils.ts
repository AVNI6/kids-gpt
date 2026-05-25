"use client";

export const getUniqueStoragePath = (
  userId: string,
  sessionId: string,
  ext: string,
  kind: "image" | "pdf" | "doc" = "doc"
) => {
  return `${userId}/${sessionId}_${kind}_${Date.now()}.${ext}`;
};
