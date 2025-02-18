// src/index.js
import * as dotenv from "dotenv";
dotenv.config();

import "./config/globals.js";

import { Bot, session } from "grammy";
import { commandHandler } from "./commands/index.js";
import { stateHandler } from "./middlewares/index.js";
import { rateLimit } from "./middlewares/rateLimit.js";
import { handleCallbackQuery } from "./handlers/callback_query.js";

const bot = new Bot(process.env.BOT_TOKEN);

// Initialize session middleware with initial state
bot.use(session({
  initial: () => ({
    state: "idle",
    step: 0,
    tempData: {}
  })
}));

// Now you can safely use global.app
global.app.db.connect(process.env.MONGODB_URI);

// Setup middleware
bot.use(rateLimit);
bot.on("callback_query", handleCallbackQuery);
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