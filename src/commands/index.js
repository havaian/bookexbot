// src/commands/index.js
import { handleStart } from "./start.js";
import { handleProfile } from "./profile.js";
import { handleStatus } from "./status.js";
import { handleBrowse } from "./browse.js";
import { handleMatches } from "./matches.js";
import { handleDebug } from "./debug.js";
import { handleAddBook } from "./add.js";
import { handleHelp } from "./help.js";

const commands = {
  "/start": handleStart,
  "/profile": handleProfile,
  "/status": handleStatus,
  "/browse": handleBrowse,
  "/matches": handleMatches,
  // "/debug": handleDebug,
  "/add": handleAddBook,
  // "/new": handleAddBook,
  "/help": handleHelp,
};

export const commandHandler = async (ctx, next) => {
  try {
    if (ctx.message && ctx.message.text) {
      const text = ctx.message.text;
      const command = commands[text];

      if (command) {
        await command(ctx);
      } else {
        await next();
      }
    } else {
      await next();
    }
  } catch (error) {
    global.app.logger.error(error);
  }
};