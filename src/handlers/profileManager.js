// src/handlers/profileManager.js
import { User } from "../models/user.js";
import { handleAddBook } from "../commands/add.js";
import { 
  getProfileMenuKeyboard, 
  getMainKeyboard, 
  getConfirmDeleteKeyboard,
  getManageBooksKeyboard
} from "../utils/keyboard.js";
import { t, formatCondition } from "../utils/localization.js";

export const handleProfileManagement = async (ctx) => {
  const validStates = [
    "profile_menu", 
    "manage_books", 
    "confirm_delete_book"
  ];
  
  // Get user's language
  const langCode = ctx.session?.language;
  
  // Log the incoming action
  global.app.logger.info(`ProfileManager: Handling "${ctx.message.text}" in state "${ctx.session.state}" with language "${langCode}"`);
  
  if (!validStates.includes(ctx.session.state)) {
    global.app.logger.info(`ProfileManager: Invalid state "${ctx.session.state}"`);
    return;
  }

  try {
    const text = ctx.message.text;
    
    // Handle back to main menu from any profile state
    if (text === t("back_to_main", langCode)) {
      ctx.session.state = "idle";
      ctx.session.tempData = {};
      global.app.logger.info("ProfileManager: Returning to main menu");
      return await ctx.reply(t("main_menu", langCode), { 
        reply_markup: getMainKeyboard(langCode) 
      });
    }
    
    // Handle profile menu options
    if (ctx.session.state === "profile_menu") {
      global.app.logger.info(`ProfileManager: In profile_menu, handling "${text}"`);
      
      if (text === t("profile_toggle_status", langCode)) {
        global.app.logger.info("ProfileManager: Toggling status");
        return await toggleUserStatus(ctx);
      } else if (text === t("profile_manage_books", langCode)) {
        global.app.logger.info("ProfileManager: Showing manage books");
        return await showManageBooks(ctx);
      } else if (text === t("profile_add_book", langCode)) {
        global.app.logger.info("ProfileManager: Handling add book");
        return await handleAddBook(ctx);
      }
    }
    
    // Handle book management options
    else if (ctx.session.state === "manage_books") {
      global.app.logger.info(`ProfileManager: In manage_books, handling "${text}"`);
      
      if (text === t("back_to_profile", langCode)) {
        global.app.logger.info("ProfileManager: Returning to profile");
        return await showProfile(ctx);
      } else if (text === t("profile_add_book", langCode)) {
        global.app.logger.info("ProfileManager: Handling add book from manage_books");
        return await handleAddBook(ctx);
      } else if (text.startsWith(t("delete_book_prefix", langCode))) {
        global.app.logger.info(`ProfileManager: Initiating deletion for "${text}"`);
        return await initiateBookDeletion(ctx, text);
      }
    }
    
    // Handle deletion confirmation
    else if (ctx.session.state === "confirm_delete_book") {
      global.app.logger.info(`ProfileManager: In confirm_delete_book, handling "${text}"`);
      
      if (text.startsWith(t("delete_confirm_prefix", langCode))) {
        global.app.logger.info("ProfileManager: Confirming deletion");
        return await deleteBook(ctx);
      } else if (text === t("delete_reject", langCode) || text === t("back_to_profile", langCode)) {
        global.app.logger.info("ProfileManager: Canceling deletion");
        return await showManageBooks(ctx);
      }
    }
    
    global.app.logger.info(`ProfileManager: No handler found for "${text}" in state "${ctx.session.state}"`);
  } catch (error) {
    global.app.logger.error("❌ Profile management error:", error);
    await ctx.reply(t("error_generic", langCode), {
      reply_markup: getMainKeyboard(langCode)
    });
  }
};

// Toggle user status
async function toggleUserStatus(ctx) {
  const langCode = ctx.session?.language;
  try {
    const user = await User.findOne({ telegramId: ctx.from.id });
    if (!user) {
      ctx.session.state = "idle";
      return await ctx.reply(t("error_user_not_found", langCode), {
        reply_markup: getMainKeyboard(langCode)
      });
    }
    
    // Toggle status
    user.status = user.status === "active" ? "inactive" : "active";
    await user.save();
    
    const statusEmoji = user.status === "active" ? "🟢" : "🔴";
    await ctx.reply(
      `${t("profile_status", langCode, statusEmoji, t(`status_${user.status}_message`, langCode))}\n\n`,
      {
        reply_markup: getProfileMenuKeyboard(user, langCode)
      }
    );
  } catch (error) {
    global.app.logger.error("❌ Status toggle error:", error);
    await ctx.reply(t("error_generic", langCode));
  }
}

// Show book management screen
async function showManageBooks(ctx) {
  const langCode = ctx.session?.language;
  try {
    const user = await User.findOne({ telegramId: ctx.from.id });
    if (!user) {
      ctx.session.state = "idle";
      return await ctx.reply(t("error_user_not_found", langCode), {
        reply_markup: getMainKeyboard(langCode)
      });
    }
    
    let message = t("book_management", langCode) + "\n\n";
    
    // Check if user has books
    if (!user.books || user.books.length === 0) {
      message += t("profile_no_books", langCode);
    } else {
      // Format book list
      const bookList = user.books
        .map((book, index) => {
          return [
            t("book_item", langCode, index + 1, book.title, book.author, formatCondition(book.condition, langCode))
          ].join("\n");
        })
        .join("\n\n");
      
      message += `${t("profile_books_header", langCode)}\n${bookList}`;
      
      // Add note about book limit
      if (user.books.length < 3) {
        message += t("profile_books_remaining", langCode, 3 - user.books.length);
      }
      
      message += t("book_select_remove", langCode);
    }
    
    await ctx.reply(message, {
      reply_markup: getManageBooksKeyboard(user, langCode)
    });
    
    // Update state
    ctx.session.state = "manage_books";
    global.app.logger.info("ProfileManager: Updated state to manage_books");
  } catch (error) {
    global.app.logger.error("❌ Show manage books error:", error);
    await ctx.reply(t("error_generic", langCode), {
      reply_markup: getMainKeyboard(langCode)
    });
  }
}

// Initiate book deletion process
async function initiateBookDeletion(ctx, text) {
  const langCode = ctx.session?.language;
  try {
    // Extract book index from button text (format: "❌ Book X: Title")
    const prefix = t("delete_book_prefix", langCode);
    const match = text.substring(prefix.length).match(/^(\d+):/);
    
    if (!match) {
      return await ctx.reply(t("error_invalid_input", langCode));
    }
    
    const bookIndex = parseInt(match[1]) - 1; // Convert to 0-based index
    
    const user = await User.findOne({ telegramId: ctx.from.id });
    if (!user || !user.books || bookIndex >= user.books.length) {
      return await ctx.reply(t("error_book_not_found", langCode), {
        reply_markup: getManageBooksKeyboard(user, langCode)
      });
    }
    
    const book = user.books[bookIndex];
    
    // Store book index for deletion confirmation
    ctx.session.state = "confirm_delete_book";
    ctx.session.tempData = { bookIndex, bookTitle: book.title };
    
    await ctx.reply(
      t("book_deletion_confirm", langCode, book.title, book.author),
      {
        reply_markup: getConfirmDeleteKeyboard(bookIndex, book.title, langCode)
      }
    );
    
    global.app.logger.info(`ProfileManager: Updated state to confirm_delete_book for book index ${bookIndex}`);
  } catch (error) {
    global.app.logger.error("❌ Initiate deletion error:", error);
    await ctx.reply(t("error_generic", langCode));
  }
}

// Delete book after confirmation
async function deleteBook(ctx) {
  const langCode = ctx.session?.language;
  try {
    if (!ctx.session.tempData || ctx.session.tempData.bookIndex === undefined) {
      ctx.session.state = "manage_books";
      return await showManageBooks(ctx);
    }
    
    const bookIndex = ctx.session.tempData.bookIndex;
    
    const user = await User.findOne({ telegramId: ctx.from.id });
    if (!user || !user.books || bookIndex >= user.books.length) {
      ctx.session.state = "manage_books";
      return await showManageBooks(ctx);
    }
    
    const bookTitle = user.books[bookIndex].title;
    
    // Remove the book at the specified index
    user.books.splice(bookIndex, 1);
    await user.save();
    
    await ctx.reply(t("book_deleted", langCode, bookTitle));
    
    // Reset state and show updated book management screen
    ctx.session.state = "manage_books";
    ctx.session.tempData = {};
    
    return await showManageBooks(ctx);
  } catch (error) {
    global.app.logger.error("❌ Delete book error:", error);
    await ctx.reply(t("error_generic", langCode));
  }
}

// Show user profile
async function showProfile(ctx) {
  const langCode = ctx.session?.language;
  try {
    const user = await User.findOne({ telegramId: ctx.from.id });
    if (!user) {
      ctx.session.state = "idle";
      return await ctx.reply(t("error_user_not_found", langCode), {
        reply_markup: getMainKeyboard(langCode)
      });
    }
    
    // Basic profile display
    const statusEmoji = user.status === "active" ? "🟢" : "🔴";
    let message = `\n${t("profile_status", langCode, statusEmoji, t(`status_${user.status}`, langCode))}\n\n`;
    
    // Check if user has books
    if (!user.books || user.books.length === 0) {
      message += t("profile_no_books", langCode);
    } else {
      // Format book list
      const bookList = user.books
        .map((book, index) => {
          return [
            t("book_item", langCode, index + 1, book.title, book.author, formatCondition(book.condition, langCode))
          ].join("\n");
        })
        .join("\n\n");
      
      message += `${t("profile_books_header", langCode)}\n${bookList}`;
      
      // Add note about book limit
      if (user.books.length < 3) {
        message += t("profile_books_remaining", langCode, 3 - user.books.length);
      }
    }
    
    message += t("profile_select_option", langCode);
    
    const keyboard = getProfileMenuKeyboard(user, langCode);
    global.app.logger.info("Profile keyboard buttons:", keyboard);
    
    await ctx.reply(message, {
      reply_markup: keyboard
    });
    
    // Update state
    ctx.session.state = "profile_menu";
    global.app.logger.info("ProfileManager: Updated state to profile_menu");
  } catch (error) {
    global.app.logger.error("❌ Show profile error:", error);
    await ctx.reply(t("error_generic", langCode), {
      reply_markup: getMainKeyboard(langCode)
    });
  }
}