// src/commands/start.js
import { User } from "../models/user.js";
import { getMainKeyboard, getBackKeyboard } from "../utils/keyboard.js";

export const handleStart = async (ctx) => {
  const { from } = ctx;

  try {
    // Check if user already exists
    let user = await User.findOne({ telegramId: from.id });

    if (!user) {
      // Create new user
      user = await User.create({
        telegramId: from.id,
        username: from.username,
        firstName: from.first_name,
        lastName: from.last_name,
      });

      // Start registration flow
      ctx.session.state = "registration";
      ctx.session.step = 1;

      global.app.logger.debug(ctx.session);

      await ctx.reply(
        "Welcome to Book Exchange! 📚\n\n" +
        "Let's set up your profile. Please add your first book by sending its title.",
        {
          reply_markup: getBackKeyboard("🔙 Cancel Registration")
        }
      );
    } else {
      await ctx.reply(
        "Welcome back to Book Exchange! 📚\n\n" +
        "Use the menu below to navigate:",
        {
          reply_markup: getMainKeyboard()
        }
      );
    }
  } catch (error) {
    global.app.logger.error("❌ Start command error:", error);
    await ctx.reply("Sorry, something went wrong. Please try again later.");
  }
};