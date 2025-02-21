// src/commands/help.js
import { getMainKeyboard } from "../utils/keyboard.js";

export const handleHelp = async (ctx) => {
  try {
    await ctx.reply(
      "📚 Book Exchange Bot - Help Guide\n\n" +
      "Welcome to Book Exchange! Use the keyboard menu below to navigate:\n\n" +
      "📚 Browse Books - Discover and like books from other users\n" +
      "📋 My Profile - View your profile and list of books\n" +
      "🔄 My Matches - See users who liked your books too\n" +
      "📕 Add Book - Add a new book to your collection\n" +
      "⚙️ Toggle Status - Switch between active/inactive\n" +
      "ℹ️ Help - Show this help message\n\n" +
      "💡 Tips:\n" +
      "• You can add up to 3 books to your profile\n" +
      "• Only active users can be found when browsing\n" +
      "• When you and another user both like each other's books, it's a match!\n" +
      "• After matching, you can contact them via Telegram to arrange an exchange\n" +
      "• Use the back button to return to the main menu anytime\n\n" +
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