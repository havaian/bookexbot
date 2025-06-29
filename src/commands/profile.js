// src/commands/profile.js
import { User } from "../models/user.js";
import { getMainKeyboard, getProfileMenuKeyboard } from "../utils/keyboard.js";
import { t, formatCondition } from "../utils/localization.js";

export const handleProfile = async (ctx) => {
  try {
    const langCode = ctx.session?.language;
    const user = await User.findOne({ telegramId: ctx.from.id });

    if (!user) {
      return await ctx.reply(t("error_not_registered", langCode), {
        reply_markup: getMainKeyboard(langCode)
      });
    }

    // Basic profile display
    const statusEmoji = user.status === "active" ? "🟢" : "🔴";
    let message = `${t("profile_status", langCode, statusEmoji, t(`status_${user.status}_message`, langCode))}\n\n`;
    
    // Check if user has books
    if (!user.books || user.books.length === 0) {
      message += t("profile_no_books", langCode);
    } else {
      // Format book list
      const bookList = user.books
        .map((book, index) => {
          return t("book_item", langCode, 
            index + 1, 
            book.title, 
            book.author, 
            formatCondition(book.condition, langCode)
          );
        })
        .join("\n\n");
      
      message += `${t("profile_books_header", langCode)}\n${bookList}`;
      
      // Add note about book limit
      if (user.books.length < 3) {
        message += t("profile_books_remaining", langCode, 3 - user.books.length);
      }
    }
    
    message += t("profile_select_option", langCode);
    
    // Create a profile menu keyboard with proper buttons
    const keyboard = getProfileMenuKeyboard(user, langCode);
    
    await ctx.reply(message, {
      reply_markup: keyboard
    });
    
    // Set state for profile management
    ctx.session.state = "profile_menu";
    
    // Log the state to help with debugging
    global.app.logger.info("Profile state set to profile_menu");
  } catch (error) {
    global.app.logger.error("❌ Profile command error:", error);
    await ctx.reply(t("error_generic", ctx.session?.language), {
      reply_markup: getMainKeyboard(ctx.session?.language)
    });
  }
};