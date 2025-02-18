// src/utils/logger.js
import winston from "winston";
import path from "path";
import fs from "fs";

// Get the caller file and line
const getCallerInfo = () => {
  const error = new Error();
  const stack = error.stack?.split("\n")[3];
  const match = stack?.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);

  if (match) {
    const [, functionName, filePath, line] = match;
    return `[${path.basename(filePath)}:${line}]`;
  }
  return "";
};

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  debug: "blue",
};

// Add colors to winston
winston.addColors(colors);

// Helper function to format objects and errors
const formatMessage = (message, meta = null) => {
  let formattedMessage = "";
  const caller = getCallerInfo();

  if (message instanceof Error) {
    formattedMessage = `${caller} ${message.message}\n${message.stack}`;
  } else if (typeof message === "object") {
    formattedMessage = `${caller}\n${JSON.stringify(message, null, 2)}`;
  } else {
    formattedMessage = `${caller} ${message}`;
  }

  if (meta) {
    if (typeof meta === "object" && Object.keys(meta).length > 0) {
      formattedMessage += `\nMetadata: ${JSON.stringify(meta, null, 2)}`;
    } else {
      formattedMessage += ` ${meta}`;
    }
  }

  return formattedMessage;
};

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Custom format for file output (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create the logger
const logger = winston.createLogger({
  levels,
  format: fileFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
      level: "debug", // Log everything to console
    }),
    // Error log file
    new winston.transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join("logs", "combined.log"),
      level: "info",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join("logs", "exceptions.log"),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join("logs", "rejections.log"),
    }),
  ],
});

// Extended logger with enhanced error handling
const enhancedLogger = {
  error: (message, error = null, meta = null) => {
    if (error instanceof Error) {
      logger.error(
        formatMessage(message, {
          error: {
            message: error.message,
            stack: error.stack,
          },
          ...meta,
        })
      );
    } else {
      logger.error(formatMessage(message, error || meta));
    }
  },
  warn: (message, meta) => logger.warn(formatMessage(message, meta)),
  info: (message, meta) => logger.info(formatMessage(message, meta)),
  debug: (message, meta) => logger.debug(formatMessage(message, meta)),
  // Add method to get all logs
  getLogs: (level = "info") => {
    try {
      const logs = require("fs").readFileSync(
        path.join("logs", `${level}.log`),
        "utf8"
      );
      return logs.split("\n").filter(Boolean);
    } catch (error) {
      console.error("Error reading logs:", error);
      return [];
    }
  },
};

export { enhancedLogger as logger };
