// src/commands/help.js
export const handleHelp = async (ctx) => {
  try {
    await ctx.reply(
      "📚 Book Exchange Bot - Commands:\n\n" +
        "📝 Basic Commands:\n" +
        "/start - Register and setup your profile\n" +
        "/help - Show this help message\n\n" +
        "📚 Book Management:\n" +
        "/add - Add a new book to exchange\n" +
        "/profile - View your profile and books\n" +
        "/status - Toggle your active/inactive status\n\n" +
        "🔄 Exchange Features:\n" +
        "/browse - Discover books from others\n" +
        "/matches - View your book matches\n\n" +
        "💡 Tips:\n" +
        "• You can add up to 3 books\n" +
        "• Only active users can be found in browse\n" +
        "• Like books to create matches\n" +
        "• You'll be notified when you get a match!"
    );
  } catch (error) {
    global.app.logger.error("Help command error:", error);
    await ctx.reply("Sorry, something went wrong. Please try again later.");
  }
};
