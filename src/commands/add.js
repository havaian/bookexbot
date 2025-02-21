// src/commands/add.js
import { User } from "../models/user.js";
import { getConditionKeyboard, getMainKeyboard, getBackKeyboard } from "../utils/keyboard.js";

export const handleAddBook = async (ctx) => {
  try {
    const user = await User.findOne({ telegramId: ctx.from.id });
    if (!user) {
      return await ctx.reply("Please use /start to register first!", {
        reply_markup: getMainKeyboard()
      });
    }

    if (user.books.length >= 3) {
      return await ctx.reply(
        "You can only have up to 3 books at a time. Please remove a book first.",
        {
          reply_markup: getMainKeyboard()
        }
      );
    }

    // Initialize add book flow
    ctx.session.state = "adding_book";
    ctx.session.step = 1;
    ctx.session.tempData = {};

    await ctx.reply("Let's add a new book! Please send me the title.", {
      reply_markup: getBackKeyboard("🔙 Cancel")
    });
  } catch (error) {
    global.app.logger.error("Add book command error:", error);
    await ctx.reply("Sorry, something went wrong. Please try again later.", {
      reply_markup: getMainKeyboard()
    });
  }
};

export const handleAddBookStep = async (ctx) => {
  const { message } = ctx;
  const { step, tempData } = ctx.session;

  if (ctx.session.state !== "adding_book") return;

  // Check for cancel action
  if (message.text === "🔙 Cancel") {
    ctx.session.state = "idle";
    ctx.session.step = 0;
    await ctx.reply("Adding book cancelled.", {
      reply_markup: getMainKeyboard()
    });
    return;
  }

  try {
    switch (step) {
      case 1: // Book title
        ctx.session.tempData.currentBook = { title: message.text };
        ctx.session.step = 2;
        await ctx.reply("Great! Now please send me the author's name.", {
          reply_markup: getBackKeyboard("🔙 Cancel")
        });
        break;

      case 2: // Book author
        ctx.session.tempData.currentBook.author = message.text;
        ctx.session.step = 3;
        await ctx.reply(
          "Thanks! How would you rate the book's condition?\n" +
          "Choose one of the options below:",
          {
            reply_markup: getConditionKeyboard()
          }
        );
        break;

      case 3: // Book condition
        const condition = await message.text.toLowerCase();
        if (!["new", "good", "fair", "poor"].includes(condition)) {
          await ctx.reply("Please choose one of the provided options:", {
            reply_markup: getConditionKeyboard()
          });
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
          "What would you like to do next?",
          {
            reply_markup: getMainKeyboard()
          }
        );
        break;
    }
  } catch (error) {
    global.app.logger.error("Add book step error:", error);
    ctx.session.state = "idle";
    ctx.session.step = 0;
    await ctx.reply(
      "Sorry, something went wrong. Please try again.",
      {
        reply_markup: getMainKeyboard()
      }
    );
  }
};