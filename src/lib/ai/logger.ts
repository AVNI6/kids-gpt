// Structured logging for AI operations

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: import("@/types/json").JsonObject;
}

function createLogEntry(
  level: LogLevel,
  module: string,
  message: string,
  data?: import("@/types/json").JsonObject
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    data,
  };
}

function formatLog(entry: LogEntry): string {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.module}]`;
  const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
  return `${prefix} ${entry.message}${dataStr}`;
}

export const aiLogger = {
  debug(module: string, message: string, data?: import("@/types/json").JsonObject) {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatLog(createLogEntry("debug", module, message, data)));
    }
  },

  info(module: string, message: string, data?: import("@/types/json").JsonObject) {
    console.info(formatLog(createLogEntry("info", module, message, data)));
  },

  warn(module: string, message: string, data?: import("@/types/json").JsonObject) {
    console.warn(formatLog(createLogEntry("warn", module, message, data)));
  },

  error(module: string, message: string, data?: import("@/types/json").JsonObject) {
    console.error(formatLog(createLogEntry("error", module, message, data)));
  },
};
