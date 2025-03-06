// src/index.js
import * as dotenv from "dotenv";
dotenv.config();

import "./config/globals.js";

import { Bot, session } from "grammy";
import { commandHandler } from "./commands/index.js";
import { stateHandler } from "./middlewares/index.js";
import { rateLimit } from "./middlewares/rateLimit.js";
import { DEFAULT_LANGUAGE } from "./utils/localization.js";
import { User } from "./models/user.js";
import { setBotInstance, checkBrowsingTimeout  } from "./commands/browse.js";

const bot = new Bot(process.env.BOT_TOKEN);

// Initialize session middleware with initial state including language
bot.use(session({
  initial: () => ({
    state: "idle",
    step: 0,
    tempData: {},
    browsing: { currentUserId: null },
    language: DEFAULT_LANGUAGE // Default language
  }),
  getSessionKey: (ctx) => {
    // Return a unique identifier for the session
    return ctx.from?.id.toString();
  },
}));

// Language middleware to load user's language preference
bot.use(async (ctx, next) => {
  if (ctx.from) {
    // Only run this middleware for message updates
    try {
      // Try to load user's language preference if not already in session
      if (!ctx.session.language) {
        const user = await User.findOne({ telegramId: ctx.from.id });
        if (user && user.language) {
          ctx.session.language = user.language;
        }
      }
    } catch (error) {
      global.app.logger.error("Error loading user language:", error);
    }
  }
  
  return next();
});

// Browsing timeout checking function
bot.use(checkBrowsingTimeout);

// Now you can safely use global.app
global.app.db.connect(process.env.MONGODB_URI);

// Setup middleware
bot.use(rateLimit);
bot.use(stateHandler);
bot.use(commandHandler);

// Start bot
bot.start({
  onStart: () => {
    global.app.logger.info(`✅ Bot started at: ${new Date().toISOString()}`);
    // Log cache stats every hour
    setInterval(() => {
      global.app.logger.debug("✅ Cache stats:", global.app.cache.getStats());
    }, 3600000);
  },
});

// Share bot instance with the browse module for notifications
setBotInstance(bot);