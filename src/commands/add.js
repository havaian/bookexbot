// src/commands/addBook.js
import { User } from "../models/user.js";

export const handleAddBook = async (ctx) => {
  try {
    const user = await User.findOne({ telegramId: ctx.from.id });
    if (!user) {
      return await ctx.reply("Please use /start to register first!");
    }

    if (user.books.length >= 3) {
      return await ctx.reply(
        "You can only have up to 3 books at a time. Please remove a book first."
      );
    }

    // Initialize add book flow
    ctx.session.state = "adding_book";
    ctx.session.step = 1;
    ctx.session.tempData = {};

    await ctx.reply("Let's add a new book! Please send me the title.");
  } catch (error) {
    global.app.logger.error("Add book command error:", error);
    await ctx.reply("Sorry, something went wrong. Please try again later.");
  }
};

export const handleAddBookStep = async (ctx) => {
  const { message } = ctx;
  const { step, tempData } = ctx.session;

  if (ctx.session.state !== "adding_book") return;

  try {
    switch (step) {
      case 1: // Book title
        ctx.session.tempData.currentBook = { title: message.text };
        ctx.session.step = 2;
        await ctx.reply("Great! Now please send me the author's name.");
        break;

      case 2: // Book author
        ctx.session.tempData.currentBook.author = message.text;
        ctx.session.step = 3;
        await ctx.reply(
          "Thanks! How would you rate the book's condition?\n" +
            "Choose: New 📘, Good 👍, Fair 👌, or Poor 😕"
        );
        break;

      case 3: // Book condition
        const condition = message.text.toLowerCase();
        if (!["new", "good", "fair", "poor"].includes(condition)) {
          await ctx.reply("Please choose one of: New, Good, Fair, or Poor");
          return;
        }

        ctx.session.tempData.currentBook.condition = condition;

        // Save book to user's profile
        const user = await User.findOne({ telegramId: ctx.from.id });
        if (!user) {
          throw new Error("User not found");
        }

        user.books.push(ctx.session.tempData.currentBook);
        await user.save();

        // Reset session
        ctx.session.state = "idle";
        ctx.session.step = 0;
        ctx.session.tempData = {};

        await ctx.reply(
          "📚 Book added successfully!\n\n" +
            "Use /browse to discover other books or /profile to see your books."
        );
        break;
    }
  } catch (error) {
    global.app.logger.error("Add book step error:", error);
    ctx.session.state = "idle";
    ctx.session.step = 0;
    await ctx.reply(
      "Sorry, something went wrong. Please try again with /addbook"
    );
  }
};
