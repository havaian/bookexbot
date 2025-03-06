// src/utils/logger.js
import winston from "winston";
import path from "path";
import fs from "fs";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

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
  // Handle exceptions and rejections - expanded configuration
  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new winston.transports.File({
      filename: path.join("logs", "exceptions.log"),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    new winston.transports.File({
      filename: path.join("logs", "rejections.log"),
    }),
  ],
  exitOnError: false, // Don't exit on handled exceptions
});

// Helper function to format objects and errors
const formatMessage = (message, meta = null) => {
  // Get caller info directly inside the function
  const error = new Error();
  const stack = error.stack?.split("\n")[3];
  const match = stack?.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
  const caller = match ? `[${path.basename(match[2])}:${match[3]}]` : "";
  
  let formattedMessage = "";

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

// Register global error handlers to capture system errors
process.on('uncaughtException', (error) => {
  logger.error(`UNCAUGHT EXCEPTION: ${error.message}\n${error.stack}`);
  // Allow some time for logging before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`UNHANDLED REJECTION: ${reason instanceof Error ? reason.stack : reason}`);
});

// Capture syntax errors and other Node.js system errors
process.on('warning', (warning) => {
  logger.warn(`NODE WARNING: ${warning.name}: ${warning.message}\n${warning.stack}`);
});

// Extended logger with enhanced error handling
const loggerInstance = {
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
      const logFile = level === 'error' ? 'error.log' : 
                     level === 'exception' ? 'exceptions.log' :
                     level === 'rejection' ? 'rejections.log' :
                     'combined.log';
      
      const logs = fs.readFileSync(
        path.join("logs", logFile),
        "utf8"
      );
      return logs.split("\n").filter(Boolean);
    } catch (error) {
      console.error("Error reading logs:", error);
      return [];
    }
  },
  // Method to explicitly log system errors
  logSystemError: (error) => {
    logger.error(`SYSTEM ERROR: ${error.message}\n${error.stack}`);
  }
};

// Add console.error override to capture native console errors
const originalConsoleError = console.error;
console.error = (...args) => {
  // Log to our system
  loggerInstance.error(`Console error: ${args.join(' ')}`);
  // Also log to original console
  originalConsoleError(...args);
};

export { loggerInstance as logger };