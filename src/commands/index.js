// src/commands/index.js
import { handleStart } from "./start.js";
import { handleProfile } from "./profile.js";
import { handleBrowse } from "./browse.js";
import { handleAddBook } from "./add.js";
import { handleHelp } from "./help.js";
import { handleLanguage } from "./language.js";
import { t } from "../utils/localization.js";

export const commandHandler = async (ctx, next) => {
  try {
    if (ctx.message && ctx.message.text) {
      const text = ctx.message.text;
      const langCode = ctx.session?.language;
      
      // Command map
      const commands = {
        "/start": handleStart,
        "/profile": handleProfile,
        "/browse": handleBrowse,
        "/add": handleAddBook,
        "/help": handleHelp,
        "/language": handleLanguage
      };
      
      // Check for command
      const command = commands[text];
      
      if (command) {
        await command(ctx);
      } else {
        // Not a command, continue to next middleware
        await next();
      }
    } else {
      await next();
    }
  } catch (error) {
    global.app.logger.error("Command handler error:", error);
    await next();
  }
};