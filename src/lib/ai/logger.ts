// Structured logging for AI operations

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, unknown>;
}

function createLogEntry(
  level: LogLevel,
  module: string,
  message: string,
  data?: Record<string, unknown>
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
  debug(module: string, message: string, data?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      console.log(formatLog(createLogEntry("debug", module, message, data)));
    }
  },

  info(module: string, message: string, data?: Record<string, unknown>) {
    console.log(formatLog(createLogEntry("info", module, message, data)));
  },

  warn(module: string, message: string, data?: Record<string, unknown>) {
    console.warn(formatLog(createLogEntry("warn", module, message, data)));
  },

  error(module: string, message: string, data?: Record<string, unknown>) {
    console.error(formatLog(createLogEntry("error", module, message, data)));
  },
};
