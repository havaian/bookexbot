// src/handlers/registration.js
import { User } from "../models/user.js";
import { getConditionKeyboard, getYesNoKeyboard, getMainKeyboard, getBackKeyboard } from "../utils/keyboard.js";
import { t, formatCondition } from "../utils/localization.js";

export const handleRegistrationStep = async (ctx) => {
  const { message } = ctx;
  const { state, step } = ctx.session;
  const langCode = ctx.session?.language;

  if (state !== "registration") return;
  
  // Check for cancel action - this needs to be handled first
  if (message.text === t("cancel_registration", langCode)) {
    ctx.session.state = "idle";
    ctx.session.step = 0;
    ctx.session.tempData = {};
    await ctx.reply(t("registration_cancelled", langCode), {
      reply_markup: getMainKeyboard(langCode)
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
        await ctx.reply(t("registration_author", langCode), {
          reply_markup: getBackKeyboard(t("cancel_registration", langCode), langCode)
        });
        break;

      case 2: // Book author
        ctx.session.tempData.currentBook.author = message.text;
        ctx.session.step = 3;
        await ctx.reply(
          t("registration_condition", langCode),
          {
            reply_markup: getConditionKeyboard(langCode)
          }
        );
        break;

        case 3: // Book condition
        // Extract the condition value from the message text
        const messageText = message.text.toLowerCase();
        let condition = '';
        
        // Check for emoji condition buttons and map to standard values
        if (messageText.includes(t("condition_new", langCode).toLowerCase())) {
          condition = 'new';
        } else if (messageText.includes(t("condition_good", langCode).toLowerCase())) {
          condition = 'good';
        } else if (messageText.includes(t("condition_fair", langCode).toLowerCase())) {
          condition = 'fair';
        } else if (messageText.includes(t("condition_poor", langCode).toLowerCase())) {
          condition = 'poor';
        } else {
          // Direct text input without emoji (fallback)
          condition = messageText;
        }
        
        // Log the condition extraction for debugging
        global.app.logger.info(`Registration: Condition text "${message.text}" mapped to "${condition}"`);
        
        // Validate the condition
        if (!["new", "good", "fair", "poor"].includes(condition)) {
          await ctx.reply(
            t("error_invalid_input", langCode),
            {
              reply_markup: getConditionKeyboard(langCode)
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
            t("registration_add_another", langCode, 3 - user.books.length),
            {
              reply_markup: getYesNoKeyboard(langCode)
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
          await ctx.reply(t("book_add_title", langCode), {
            reply_markup: getBackKeyboard(t("cancel_registration", langCode), langCode)
          });
        } else {
          await completeRegistration(ctx);
        }
        break;
    }
  } catch (error) {
    global.app.logger.error("❌ Registration error:", error);
    await ctx.reply(
      t("error_generic", langCode),
      {
        reply_markup: getMainKeyboard(langCode)
      }
    );
  }
};

const completeRegistration = async (ctx) => {
  const langCode = ctx.session?.language;
  ctx.session.state = "idle";
  ctx.session.step = 0;
  ctx.session.tempData = {};

  await ctx.reply(
    t("registration_complete", langCode),
    {
      reply_markup: getMainKeyboard(langCode)
    }
  );
};