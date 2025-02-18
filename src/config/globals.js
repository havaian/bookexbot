// src/config/globals.js
import { connectDB } from "./database.js";
import { sessionService } from "../utils/session.js";
import { cacheService } from "../services/cache.js";
import { logger } from "../utils/logger.js";

// Create a global object to store shared functions and services
const globals = {
  db: {
    connect: connectDB,
    // Add other DB functions
  },
  session: {
    ...sessionService,
    // Add other session functions
  },
  cache: {
    ...cacheService,
    // Add other cache functions
  },
  logger: logger,
};

// Make it globally available
global.app = globals;

export default globals;