// src/commands/help.js
import { getMainKeyboard } from "../utils/keyboard.js";

export const handleHelp = async (ctx) => {
  try {
    await ctx.reply(
      "📚 Book Exchange Bot - Help Guide\n\n" +
      "Welcome to Book Exchange! Use the keyboard menu below to navigate:\n\n" +
      "📚 Browse Books - Discover and like books from other users\n" +
      "📋 My Profile - Manage your profile, status, and books\n" +
      "ℹ️ Help - Show this help message\n\n" +
      "💡 Profile Management:\n" +
      "• Toggle your active/inactive status\n" +
      "• Add new books (up to 3 total)\n" +
      "• Manage your existing books\n\n" +
      "💡 Book Exchange Process:\n" +
      "• Add books to your profile\n" +
      "• Browse books from other users\n" +
      "• Like books that interest you\n" +
      "• When you and another user both like each other's books, it's a match!\n" +
      "• After a match, you'll receive the other user's contact details\n" +
      "• Contact them directly through Telegram to arrange your exchange\n\n" +
      "Happy book exchanging! 📖",
      {
        reply_markup: getMainKeyboard()
      }
    );
  } catch (error) {
    global.app.logger.error("Help command error:", error);
    await ctx.reply("Sorry, something went wrong. Please try again later.", {
      reply_markup: getMainKeyboard()
    });
  }
};