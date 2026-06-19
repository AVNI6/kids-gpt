import React from "react";
import {
  FileText,
  Video,
  Link as LinkIcon,
  Image as ImageIcon,
  FolderOpen,
} from "lucide-react";
import type { ClassroomResource } from "@/types/classroom.types";

export type ResourceDisplayType = "PDF" | "VIDEO" | "LINK" | "IMAGE" | "DOCUMENT";

export function getResourceDisplay(res: ClassroomResource) {
  const ext = (res.resource_url || res.storage_path || "").split(".").pop()?.toLowerCase();
  
  let displayType: ResourceDisplayType = "DOCUMENT";
  
  if (res.resource_type === "PDF") {
    displayType = "PDF";
  } else if (res.resource_type === "VIDEO") {
    displayType = "VIDEO";
  } else if (res.resource_type === "LINK") {
    displayType = "LINK";
  } else if (res.resource_type === "DOCUMENT" && ext) {
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
      displayType = "IMAGE";
    } else if (ext === "pdf") {
      displayType = "PDF";
    } else {
      displayType = "DOCUMENT";
    }
  }

  const isPdf = displayType === "PDF";
  const isVideo = displayType === "VIDEO";
  const isLink = displayType === "LINK";
  const isImg = displayType === "IMAGE";
  const isDoc = displayType === "DOCUMENT";

  let icon = <FolderOpen className="h-5 w-5" />;
  let colorClass = "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400";

  switch (displayType) {
    case "PDF":
      icon = <FileText className="h-5 w-5" />;
      colorClass = "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-450";
      break;
    case "VIDEO":
      icon = <Video className="h-5 w-5" />;
      colorClass = "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-450";
      break;
    case "LINK":
      icon = <LinkIcon className="h-5 w-5" />;
      colorClass = "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400";
      break;
    case "IMAGE":
      icon = <ImageIcon className="h-5 w-5" />;
      colorClass = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-450";
      break;
    case "DOCUMENT":
      icon = <FileText className="h-5 w-5" />;
      colorClass = "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-450";
      break;
  }

  return {
    displayType,
    isPdf,
    isVideo,
    isLink,
    isImg,
    isDoc,
    icon,
    colorClass,
  };
}

export const useResourceDisplay = getResourceDisplay;
