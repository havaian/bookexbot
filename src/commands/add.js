// src/commands/add.js
import { User } from "../models/user.js";
import { getConditionKeyboard, getMainKeyboard, getBackKeyboard } from "../utils/keyboard.js";
import { t } from "../utils/localization.js";

export const handleAddBook = async (ctx) => {
  try {
    const langCode = ctx.session?.language;
    const user = await User.findOne({ telegramId: ctx.from.id });
    
    if (!user) {
      return await ctx.reply(t("error_not_registered", langCode), {
        reply_markup: getMainKeyboard(langCode) 
      });
    }

    if (user.books.length >= 3) {
      return await ctx.reply(
        t("book_limit_reached", langCode),
        {
          reply_markup: getMainKeyboard(langCode)
        }
      );
    }

    // Initialize add book flow
    ctx.session.state = "adding_book";
    ctx.session.step = 1;
    ctx.session.tempData = {};

    await ctx.reply(t("book_add_title", langCode), {
      reply_markup: getBackKeyboard(t("cancel", langCode), langCode)
    });
  } catch (error) {
    global.app.logger.error("Add book command error:", error);
    await ctx.reply(t("error_generic", ctx.session?.language), {
      reply_markup: getMainKeyboard(ctx.session?.language)
    });
  }
};

export const handleAddBookStep = async (ctx) => {
  const { message } = ctx;
  const { step } = ctx.session;
  const langCode = ctx.session?.language;

  if (ctx.session.state !== "adding_book") return;
  
  // Check for cancel action
  if (message.text === t("cancel", langCode)) {
    ctx.session.state = "idle";
    ctx.session.step = 0;
    ctx.session.tempData = {};
    await ctx.reply(t("book_add_cancelled", langCode), {
      reply_markup: getMainKeyboard(langCode)
    });
    return;
  }

  try {
    switch (step) {
      case 1: // Book title
        ctx.session.tempData.currentBook = { title: message.text };
        ctx.session.step = 2;
        await ctx.reply(t("registration_author", langCode), {
          reply_markup: getBackKeyboard(t("cancel", langCode), langCode)
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
        
        // Validate the condition
        if (!["new", "good", "fair", "poor"].includes(condition)) {
          global.app.logger.warn(`Invalid condition: ${condition} from text: ${message.text}`);
          await ctx.reply(t("error_invalid_input", langCode), {
            reply_markup: getConditionKeyboard(langCode)
          });
          return;
        }
      
        // Store the normalized condition
        ctx.session.tempData.currentBook.condition = condition;
        global.app.logger.info(`Condition set to: ${condition} from text: ${message.text}`);
      
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
          t("book_add_success", langCode),
          {
            reply_markup: getMainKeyboard(langCode)
          }
        );
        break;
    }
  } catch (error) {
    global.app.logger.error("Add book step error:", error);
    ctx.session.state = "idle";
    ctx.session.step = 0;
    await ctx.reply(
      t("error_generic", langCode),
      {
        reply_markup: getMainKeyboard(langCode)
      }
    );
  }
};