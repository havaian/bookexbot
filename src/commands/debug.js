// src/commands/debug.js
import { User } from "../models/user.js";

export const handleDebug = async (ctx) => {
  try {
    const currentUserId = ctx.from.id;

    const allUsers = await User.find({});
    const activeUsers = await User.find({ status: "active" });
    const usersWithBooks = await User.find({ "books.0": { $exists: true } });
    const otherUsers = await User.find({
      telegramId: { $ne: currentUserId },
      status: "active",
      "books.0": { $exists: true },
    });

    global.app.logger.debug("Debug information:", {
      allUsers,
      activeUsers,
      usersWithBooks,
      otherUsers,
    });

    await ctx.reply(
      `📊 Debug Statistics:\n\n` +
        `Total users: ${allUsers.length}\n` +
        `Active users: ${activeUsers.length}\n` +
        `Users with books: ${usersWithBooks.length}\n` +
        `Other users available for browse: ${otherUsers.length}\n\n` +
        `Your ID: ${currentUserId}\n\n` +
        `Note: Browse only shows books from OTHER users`
    );
  } catch (error) {
    global.app.logger.error("Debug command error:", error);
    await ctx.reply("Error running debug command");
  }
};
