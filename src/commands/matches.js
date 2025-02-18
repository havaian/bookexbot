// src/commands/matches.js
import { User } from "../models/user.js";
import { Match } from "../models/match.js";

export const handleMatches = async (ctx) => {
  try {
    const currentUserId = ctx.from.id;

    // Find all active matches for current user
    const matches = await Match.find({
      users: currentUserId,
      status: "active",
    });

    if (!matches.length) {
      return await ctx.reply(
        "You don't have any matches yet. 🤔\n" +
          "Use /browse to discover more books!"
      );
    }

    // Get matched users' details
    const matchPromises = matches.map(async (match) => {
      const otherUserId = match.users.find((id) => id !== currentUserId);
      const otherUser = await User.findOne({ telegramId: otherUserId });

      if (!otherUser) return null;

      const books = otherUser.books
        .map((book) => `- ${book.title} by ${book.author}`)
        .join("\n");

      return {
        user: otherUser,
        books,
        matchId: match._id,
      };
    });

    const matchDetails = (await Promise.all(matchPromises)).filter((m) => m);

    // Create message for each match
    const matchMessages = matchDetails.map(
      (match, index) =>
        `Match #${index + 1}:\n` +
        `User: ${match.user.firstName} ${match.user.lastName || ""}\n` +
        `Books:\n${match.books}\n` +
        `Contact: @${match.user.username || "[no username]"}\n` +
        `------------------`
    );

    await ctx.reply(
      "Your Matches 🤝\n\n" +
        matchMessages.join("\n\n") +
        "\n\nStart a conversation to arrange your book exchange!"
    );
  } catch (error) {
    global.app.logger.error("❌ Matches command error:", error);
    await ctx.reply("Sorry, something went wrong. Please try again later.");
  }
};
