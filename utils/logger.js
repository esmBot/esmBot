import winston from "winston";
import "winston-daily-rotate-file";

const logger = winston.createLogger({
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    main: 3,
    debug: 4
  },
  transports: [
    new winston.transports.Console({ format: winston.format.colorize({ all: true }), stderrLevels: ["error", "warn"] }),
    new winston.transports.DailyRotateFile({ filename: "logs/error-%DATE%.log", level: "error", zippedArchive: true, maxSize: 4194304, maxFiles: 8 }),
    new winston.transports.DailyRotateFile({ filename: "logs/main-%DATE%.log", zippedArchive: true, maxSize: 4194304, maxFiles: 8 })
  ],
  level: process.env.DEBUG_LOG ? "debug" : "main",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf((info) => {
      const {
        timestamp, level, message, ...args
      } = info;

      return `[${timestamp}]: [${level.toUpperCase()}] - ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ""}`;
    }),
  )
});

winston.addColors({
  info: "green",
  main: "gray",
  debug: "magenta",
  warn: "yellow",
  error: "red"
});

export function log(type, content) { return content ? logger.log(type === "log" ? "main" : type, content) : logger.info(type); }

export function info(...args) { return log("info", ...args); }

export function error(...args) { return log("error", ...args); }

export function warn(...args) { return log("warn", ...args); }

export function debug(...args) { return log("debug", ...args); }

export default {
  log,
  info,
  error,
  warn,
  debug
};