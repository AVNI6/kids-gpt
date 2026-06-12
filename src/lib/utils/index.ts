import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLocalDateString(dateObj: Date, timezone: string = "Asia/Kolkata") {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(dateObj);
  } catch {
    const offset = dateObj.getTimezoneOffset();
    const local = new Date(dateObj.getTime() - offset * 60 * 1000);
    return local.toISOString().split("T")[0];
  }
}
