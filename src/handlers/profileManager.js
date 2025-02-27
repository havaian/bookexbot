// src/handlers/profileManager.js
import { User } from "../models/user.js";
import { handleAddBook } from "../commands/add.js";
import { 
  getProfileMenuKeyboard, 
  getMainKeyboard, 
  getConfirmDeleteKeyboard,
  getManageBooksKeyboard
} from "../utils/keyboard.js";

export const handleProfileManagement = async (ctx) => {
  const validStates = [
    "profile_menu", 
    "manage_books", 
    "confirm_delete_book"
  ];
  
  // Log the incoming action
  global.app.logger.debug(`ProfileManager: Handling "${ctx.message.text}" in state "${ctx.session.state}"`);
  
  if (!validStates.includes(ctx.session.state)) {
    global.app.logger.debug(`ProfileManager: Invalid state "${ctx.session.state}"`);
    return;
  }

  try {
    const text = ctx.message.text;
    
    // Handle back to main menu from any profile state
    if (text === "🔙 Back to Main Menu") {
      ctx.session.state = "idle";
      ctx.session.tempData = {};
      global.app.logger.debug("ProfileManager: Returning to main menu");
      return await ctx.reply("Main Menu", { reply_markup: getMainKeyboard() });
    }
    
    // Handle profile menu options
    if (ctx.session.state === "profile_menu") {
      global.app.logger.debug(`ProfileManager: In profile_menu, handling "${text}"`);
      
      if (text === "🔄 Toggle Status") {
        global.app.logger.debug("ProfileManager: Toggling status");
        return await toggleUserStatus(ctx);
      } else if (text === "📚 Manage Books") {
        global.app.logger.debug("ProfileManager: Showing manage books");
        return await showManageBooks(ctx);
      } else if (text === "📕 Add Book") {
        global.app.logger.debug("ProfileManager: Handling add book");
        return await handleAddBook(ctx);
      }
    }
    
    // Handle book management options
    else if (ctx.session.state === "manage_books") {
      global.app.logger.debug(`ProfileManager: In manage_books, handling "${text}"`);
      
      if (text === "🔙 Back to Profile") {
        global.app.logger.debug("ProfileManager: Returning to profile");
        return await showProfile(ctx);
      } else if (text === "📕 Add Book") {
        global.app.logger.debug("ProfileManager: Handling add book from manage_books");
        return await handleAddBook(ctx);
      } else if (text.startsWith("❌ Book ")) {
        global.app.logger.debug(`ProfileManager: Initiating deletion for "${text}"`);
        return await initiateBookDeletion(ctx, text);
      }
    }
    
    // Handle deletion confirmation
    else if (ctx.session.state === "confirm_delete_book") {
      global.app.logger.debug(`ProfileManager: In confirm_delete_book, handling "${text}"`);
      
      if (text.startsWith("✅ Yes, delete")) {
        global.app.logger.debug("ProfileManager: Confirming deletion");
        return await deleteBook(ctx);
      } else if (text === "❌ No, keep it" || text === "🔙 Back to Profile") {
        global.app.logger.debug("ProfileManager: Canceling deletion");
        return await showManageBooks(ctx);
      }
    }
    
    global.app.logger.debug(`ProfileManager: No handler found for "${text}" in state "${ctx.session.state}"`);
  } catch (error) {
    global.app.logger.error("❌ Profile management error:", error);
    await ctx.reply("Sorry, something went wrong. Please try again.", {
      reply_markup: getMainKeyboard()
    });
  }
};

// Toggle user status
async function toggleUserStatus(ctx) {
  try {
    const user = await User.findOne({ telegramId: ctx.from.id });
    if (!user) {
      ctx.session.state = "idle";
      return await ctx.reply("User not found. Please use /start to register.", {
        reply_markup: getMainKeyboard()
      });
    }
    
    // Toggle status
    user.status = user.status === "active" ? "inactive" : "active";
    await user.save();
    
    const statusEmoji = user.status === "active" ? "🟢" : "🔴";
    await ctx.reply(
      `Your status has been updated to: ${statusEmoji} ${user.status}\n\n` +
      (user.status === "active"
        ? "Your books are now visible to other users."
        : "Your books are now hidden from other users."),
      {
        reply_markup: getProfileMenuKeyboard(user)
      }
    );
  } catch (error) {
    global.app.logger.error("❌ Status toggle error:", error);
    await ctx.reply("Sorry, something went wrong. Please try again.");
  }
}

// Show book management screen
async function showManageBooks(ctx) {
  try {
    const user = await User.findOne({ telegramId: ctx.from.id });
    if (!user) {
      ctx.session.state = "idle";
      return await ctx.reply("User not found. Please use /start to register.", {
        reply_markup: getMainKeyboard()
      });
    }
    
    let message = "📚 Book Management\n\n";
    
    // Check if user has books
    if (!user.books || user.books.length === 0) {
      message += "You don't have any books yet! Use the Add Book button to add your first book.";
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
      
      message += "\n\nSelect a book to remove or add a new book:";
    }
    
    await ctx.reply(message, {
      reply_markup: getManageBooksKeyboard(user)
    });
    
    // Update state
    ctx.session.state = "manage_books";
    global.app.logger.debug("ProfileManager: Updated state to manage_books");
  } catch (error) {
    global.app.logger.error("❌ Show manage books error:", error);
    await ctx.reply("Sorry, something went wrong. Please try again.", {
      reply_markup: getMainKeyboard()
    });
  }
}

// Initiate book deletion process
async function initiateBookDeletion(ctx, text) {
  try {
    // Extract book index from button text (format: "❌ Book X: Title")
    const match = text.match(/❌ Book (\d+):/);
    if (!match) {
      return await ctx.reply("Invalid book selection. Please try again.");
    }
    
    const bookIndex = parseInt(match[1]) - 1; // Convert to 0-based index
    
    const user = await User.findOne({ telegramId: ctx.from.id });
    if (!user || !user.books || bookIndex >= user.books.length) {
      return await ctx.reply("Book not found. Please try again.", {
        reply_markup: getManageBooksKeyboard(user)
      });
    }
    
    const book = user.books[bookIndex];
    
    // Store book index for deletion confirmation
    ctx.session.state = "confirm_delete_book";
    ctx.session.tempData = { bookIndex, bookTitle: book.title };
    
    await ctx.reply(
      `Are you sure you want to delete this book?\n\n` +
      `Title: ${book.title}\n` +
      `Author: ${book.author}`,
      {
        reply_markup: getConfirmDeleteKeyboard(bookIndex, book.title)
      }
    );
    
    global.app.logger.debug(`ProfileManager: Updated state to confirm_delete_book for book index ${bookIndex}`);
  } catch (error) {
    global.app.logger.error("❌ Initiate deletion error:", error);
    await ctx.reply("Sorry, something went wrong. Please try again.");
  }
}

// Delete book after confirmation
async function deleteBook(ctx) {
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
    
    await ctx.reply(`Book "${bookTitle}" has been deleted.`);
    
    // Reset state and show updated book management screen
    ctx.session.state = "manage_books";
    ctx.session.tempData = {};
    
    return await showManageBooks(ctx);
  } catch (error) {
    global.app.logger.error("❌ Delete book error:", error);
    await ctx.reply("Sorry, something went wrong. Please try again.");
  }
}

// Show user profile
async function showProfile(ctx) {
  try {
    const user = await User.findOne({ telegramId: ctx.from.id });
    if (!user) {
      ctx.session.state = "idle";
      return await ctx.reply("User not found. Please use /start to register.", {
        reply_markup: getMainKeyboard()
      });
    }
    
    // Basic profile display
    const statusEmoji = user.status === "active" ? "🟢" : "🔴";
    let message = `Profile Details:\n` +
      `Name: ${user.firstName} ${user.lastName || ""}\n` +
      `Status: ${statusEmoji} ${user.status}\n\n`;
    
    // Check if user has books
    if (!user.books || user.books.length === 0) {
      message += "You don't have any books yet! Add books to start exchanging.";
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
    
    message += "\n\nSelect an option below:";
    
    const keyboard = getProfileMenuKeyboard(user);
    global.app.logger.debug("Profile keyboard buttons:", keyboard);
    
    await ctx.reply(message, {
      reply_markup: keyboard
    });
    
    // Update state
    ctx.session.state = "profile_menu";
    global.app.logger.debug("ProfileManager: Updated state to profile_menu");
  } catch (error) {
    global.app.logger.error("❌ Show profile error:", error);
    await ctx.reply("Sorry, something went wrong. Please try again.", {
      reply_markup: getMainKeyboard()
    });
  }
}

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