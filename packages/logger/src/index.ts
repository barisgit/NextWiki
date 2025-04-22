import { format } from "date-fns";

// Define log levels and their order
enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

const LogLevelOrder: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.WARN]: 3,
  [LogLevel.ERROR]: 4,
};

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
  blue: "\x1b[34m",
  orange: "\x1b[38;5;208m",
  purple: "\x1b[38;5;129m",
};

const levelColors: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: colors.purple,
  [LogLevel.INFO]: colors.green,
  [LogLevel.WARN]: colors.yellow,
  [LogLevel.ERROR]: colors.red,
};

// Assign specific colors to known origins
const originColors: Record<string, string> = {
  WSS: colors.magenta,
  PROD: colors.cyan,
  NEXT: colors.blue, // From user's package.json change
  CLIENT: colors.orange, // Specific color for client-side logs
  APP: colors.green,
};

const defaultOriginColor = colors.gray; // Fallback color

// Safe check for TTY, defaults to false in non-Node.js environments
const useColors =
  typeof window === "undefined" && // Check if NOT in browser first
  typeof process !== "undefined" &&
  process.stdout?.isTTY === true;

// Get server-side origin using env (only checked when on server)
const getServerProcessOrigin = (): string | undefined => {
  // env.PROCESS_ORIGIN should only be accessed server-side
  if (typeof window === "undefined") {
    const origin = process.env.PROCESS_ORIGIN;
    if (origin === "WSS" || origin === "PROD" || origin === "NEXT") {
      return origin;
    }
  }
  return undefined;
};

// Formats only the prefix part of the log message
const formatLogPrefix = (level: LogLevel, origin: string): string => {
  const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss.SSS");
  const levelColor = levelColors[level] || colors.reset;
  const originColor = originColors[origin.toUpperCase()] || defaultOriginColor;

  if (useColors) {
    return `${colors.gray}[${timestamp}]${
      colors.reset
    } ${levelColor}${level.padEnd(5)}${
      colors.reset
    } ${originColor}[${origin.toUpperCase()}]${colors.reset}`;
  } else {
    return `[${timestamp}] ${level.padEnd(5)} [${origin.toUpperCase()}]`;
  }
};

export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  log: (message: string, ...args: unknown[]) => void; // Alias for info
}

interface CreateLoggerOptions {
  maxLevel?: LogLevel;
}

/**
 * Creates a new logger instance associated with a specific origin.
 */
export const createLogger = (
  origin_param?: string,
  options?: CreateLoggerOptions
): Logger => {
  const defaultMaxLevel =
    process.env.NEXT_PUBLIC_NODE_ENV === "production"
      ? LogLevel.INFO
      : LogLevel.DEBUG;

  const maxLevel = options?.maxLevel || defaultMaxLevel;
  const maxLevelOrder = LogLevelOrder[maxLevel];

  // Determine origin: param -> server detect -> client detect -> fallback
  const origin = origin_param
    ? origin_param
    : typeof window === "undefined"
      ? (getServerProcessOrigin() ?? "APP") // Server: try detect, else APP
      : "CLIENT"; // Client: always CLIENT

  const logFn =
    (level: LogLevel) =>
    (message: string, ...args: unknown[]) => {
      const currentLevelOrder = LogLevelOrder[level];

      if (currentLevelOrder < maxLevelOrder) {
        return;
      }

      // Format only the prefix
      const prefix = formatLogPrefix(level, origin);

      // Pass prefix and original arguments to console methods
      switch (level) {
        case LogLevel.DEBUG:
        case LogLevel.INFO:
          console.log(prefix, message, ...args);
          break;
        case LogLevel.WARN:
          console.warn(prefix, message, ...args);
          break;
        case LogLevel.ERROR:
          console.error(prefix, message, ...args);
          break;
      }
    };

  return {
    debug: logFn(LogLevel.DEBUG),
    info: logFn(LogLevel.INFO),
    warn: logFn(LogLevel.WARN),
    error: logFn(LogLevel.ERROR),
    log: logFn(LogLevel.INFO),
  };
};

// --- Singleton Logger Instances ---

/**
 * Logger instance specifically for the WebSocket Development Server.
 */
export const wssLogger = createLogger("WSS");

/**
 * Logger instance specifically for the Production Server / Next.js SSR.
 */
export const prodLogger = createLogger("PROD");

/**
 * Logger instance specifically for the Next.js Development/Build process.
 */
export const nextLogger = createLogger("NEXT");

/**
 * Logger instance specifically for client-side browser code.
 */
export const clientLogger = createLogger("CLIENT");

/**
 * A default logger instance. Automatically detects if running on Server (WSS/PROD/NEXT)
 * or Client (CLIENT) and uses the appropriate origin.
 * Falls back to 'APP' if server origin cannot be detected.
 * Useful for shared code where the context isn't immediately obvious.
 */
export const logger = createLogger(); // Will now auto-detect server/client origin
