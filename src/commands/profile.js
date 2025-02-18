// src/commands/profile.js
import { User } from "../models/user.js";
import { formatProfile, formatError } from "../utils/formatters.js";

export const handleProfile = async (ctx) => {
  try {
    const user = await User.findOne({ telegramId: ctx.from.id });

    if (!user) {
      return await ctx.reply(formatError("notRegistered"));
    }

    await ctx.reply(
      formatProfile(user) +
        "\n\n" +
        "Commands:\n" +
        "/status - Toggle active/inactive\n" +
        "/browse - Start discovering books\n" +
        "/help - Get full list of available commands"
    );
  } catch (error) {
    global.app.logger.error("❌ Profile command error:", error);
    await ctx.reply(formatError("generic"));
  }
};
