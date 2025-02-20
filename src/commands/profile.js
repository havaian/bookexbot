// src/commands/profile.js
import { User } from "../models/user.js";
import { formatProfile, formatError } from "../utils/formatters.js";
import { getMainKeyboard } from "../utils/keyboard.js";

export const handleProfile = async (ctx) => {
  try {
    const user = await User.findOne({ telegramId: ctx.from.id });

    if (!user) {
      return await ctx.reply(formatError("notRegistered"), {
        reply_markup: getMainKeyboard()
      });
    }

    // Basic profile display
    const statusEmoji = user.status === "active" ? "🟢" : "🔴";
    let message = `Profile Details:\nName: ${user.firstName} ${user.lastName || ""}\nStatus: ${statusEmoji} ${user.status}\n\n`;

    // Check if user has books
    if (!user.books || user.books.length === 0) {
      message += "You don't have any books yet! Use the 📕 Add Book button to add your first book.";
    } else {
      // Format book list
      const bookList = user.books
        .map((book, index) => {
          return [
            `📚 Book ${index + 1}:`,
            `Title: ${book.title}`,
            `Author: ${book.author}`,
            `Condition: ${formatCondition(book.condition)}`
          ].join("\n");
        })
        .join("\n\n");

      message += `Your Books:\n${bookList}`;

      // Add note about book limit
      if (user.books.length < 3) {
        message += `\n\nYou can add ${3 - user.books.length} more book(s).`;
      }
    }

    await ctx.reply(
      message + "\n\nUse the menu below to navigate:",
      {
        reply_markup: getMainKeyboard()
      }
    );
  } catch (error) {
    global.app.logger.error("❌ Profile command error:", error);
    await ctx.reply(formatError("generic"), {
      reply_markup: getMainKeyboard()
    });
  }
};

// Format condition with emoji
const formatCondition = (condition) => {
  const conditionEmojis = {
    new: "📘 New",
    good: "👍 Good",
    fair: "👌 Fair",
    poor: "😕 Poor",
  };
  return conditionEmojis[condition?.toLowerCase()] || condition || "Not specified";
};