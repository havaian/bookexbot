// src/handlers/registration.js
import { User } from "../models/user.js";
import { getConditionKeyboard, getYesNoKeyboard, getMainKeyboard, getBackKeyboard } from "../utils/keyboard.js";

export const handleRegistrationStep = async (ctx) => {
  const { message } = ctx;
  const { state, step } = ctx.session;

  if (state !== "registration") return;

  // Check for cancel action - this needs to be handled first
  if (message.text === "🔙 Cancel Registration") {
    ctx.session.state = "idle";
    ctx.session.step = 0;
    ctx.session.tempData = {};
    await ctx.reply("Registration cancelled. You can start over anytime.", {
      reply_markup: getMainKeyboard()
    });
    return;
  }

  try {
    // Initialize tempData if it doesn't exist
    if (!ctx.session.tempData) {
      ctx.session.tempData = {};
    }

    switch (step) {
      case 1: // Book title
        ctx.session.tempData.currentBook = { title: message.text };
        ctx.session.step = 2;
        await ctx.reply("Great! Now please send me the author's name.", {
          reply_markup: getBackKeyboard("🔙 Cancel Registration")
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
        const condition = message.text.toLowerCase();
        if (!["new", "good", "fair", "poor"].includes(condition)) {
          await ctx.reply(
            "Please choose one of the provided options:",
            {
              reply_markup: getConditionKeyboard()
            }
          );
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

        // Check if user wants to add another book
        if (user.books.length < 3) {
          await ctx.reply(
            `Book added! Would you like to add another book? You can add ${3 - user.books.length} more books.`,
            {
              reply_markup: getYesNoKeyboard()
            }
          );
          ctx.session.step = 4;
        } else {
          await completeRegistration(ctx);
        }
        break;

      case 4: // Add another book?
        if (message.text.toLowerCase() === "yes") {
          ctx.session.step = 1;
          ctx.session.tempData.currentBook = {};
          await ctx.reply("Ok! Please send me the title of your next book.", {
            reply_markup: getBackKeyboard("🔙 Cancel Registration")
          });
        } else {
          await completeRegistration(ctx);
        }
        break;
    }
  } catch (error) {
    global.app.logger.error("❌ Registration error:", error);
    await ctx.reply(
      "Sorry, something went wrong. Please try again or use /start to restart.",
      {
        reply_markup: getMainKeyboard()
      }
    );
  }
};

const completeRegistration = async (ctx) => {
  ctx.session.state = "idle";
  ctx.session.step = 0;
  ctx.session.tempData = {};

  await ctx.reply(
    "Perfect! Your profile is all set up. 🎉\n\n" +
    "Use the menu below to navigate:",
    {
      reply_markup: getMainKeyboard()
    }
  );
};