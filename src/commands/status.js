// src/commands/status.js
import { User } from "../models/user.js";

export const handleStatus = async (ctx) => {
  try {
    const user = await User.findOne({ telegramId: ctx.from.id });

    if (!user) {
      return await ctx.reply("Please use /start to register first!");
    }

    // Toggle status
    user.status = user.status === "active" ? "inactive" : "active";
    await user.save();

    const statusEmoji = user.status === "active" ? "🟢" : "🔴";
    await ctx.reply(
      `Your status has been updated to: ${statusEmoji} ${user.status}\n\n` +
        (user.status === "active"
          ? "Your books are now visible to other users."
          : "Your books are now hidden from other users.")
    );
  } catch (error) {
    global.app.logger.error("❌ Status command error:", error);
    await ctx.reply("Sorry, something went wrong. Please try again later.");
  }
};
