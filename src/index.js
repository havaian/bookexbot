// src/index.js
import { config } from 'dotenv';
config();

import "./config/globals.js";

import { Bot, session } from "grammy";
import { commandHandler } from "./commands/index.js";
import { stateHandler } from "./middlewares/index.js";
import { rateLimit } from "./middlewares/rateLimit.js";
import { DEFAULT_LANGUAGE } from "./utils/localization.js";
import { User } from "./models/user.js";
import { setBotInstance, checkBrowsingTimeout } from "./commands/browse.js";

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
    try {
      const user = await User.findOne({ telegramId: ctx.from.id });
      if (user && user.language) {
        // Set the language in session
        ctx.session.language = user.language;
        console.log(`User language set to: ${ctx.session.language}`);
      } else {
        console.log(`No language preference found for user ${ctx.from.id}, using default: ${DEFAULT_LANGUAGE}`);
        ctx.session.language = DEFAULT_LANGUAGE;
      }
    } catch (error) {
      global.app.logger.error("Error loading user language:", error);
      ctx.session.language = DEFAULT_LANGUAGE;
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

setBotInstance(bot);

// Start bot
bot.start({
  onStart: () => {
    global.app.logger.info(`✅ Bot started at: ${new Date().toISOString()}`);
    // Log cache stats every hour
    setInterval(() => {
      try {
        if (global.app && global.app.cache && typeof global.app.cache.getStats === 'function') {
          global.app.logger.info("✅ Cache stats:", global.app.cache.getStats());
        } else {
          global.app.logger.info("✅ Cache stats: Not available");
        }
      } catch (error) {
        // Log the error but don't let it crash the application
        console.error("Error getting cache stats:", error);
        if (global.app && global.app.logger) {
          global.app.logger.error("Error getting cache stats:", error);
        }
      }
    }, 3600000);
  },
});

bot.catch((err) => {
  console.error('Bot error caught:', err);
  // If using your logger
  if (global.app && global.app.logger) {
    global.app.logger.error('Bot error caught:', err);
  }
});