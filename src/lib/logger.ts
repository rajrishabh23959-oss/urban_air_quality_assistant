type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function resolveLogLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return process.env.NODE_ENV === "test" ? "error" : "info";
}

function writeLog(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const minLevel = resolveLogLevel();
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[minLevel]) {
    return;
  }

  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ? { context } : {}),
  });

  if (level === "error" || level === "warn") {
    process.stderr.write(`${entry}\n`);
  } else {
    process.stdout.write(`${entry}\n`);
  }
}

/**
 * Structured application logger that avoids raw console statements.
 */
export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => writeLog("debug", message, context),
  info: (message: string, context?: Record<string, unknown>) => writeLog("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => writeLog("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => writeLog("error", message, context),
};
