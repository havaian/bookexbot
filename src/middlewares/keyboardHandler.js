// src/middlewares/keyboardHandler.js
import { handleStart } from "../commands/start.js";
import { handleProfile } from "../commands/profile.js";
import { handleBrowse, handleBrowseAction } from "../commands/browse.js";
import { handleAddBook } from "../commands/add.js";
import { handleHelp } from "../commands/help.js";
import { handleProfileManagement } from "../handlers/profileManager.js";
import { getMainKeyboard } from "../utils/keyboard.js";

// Map keyboard buttons to their corresponding handler functions
const keyboardActions = {
  "📚 Browse Books": handleBrowse,
  "📋 My Profile": handleProfile,
  "ℹ️ Help": handleHelp,
  "🔙 Back to Main Menu": async (ctx) => {
    ctx.session.state = "idle";
    ctx.session.step = 0;
    ctx.session.tempData = {};
    await ctx.reply("Main Menu", { reply_markup: getMainKeyboard() });
  }
};

// Process condition selection for adding books
const processConditionInput = (text) => {
  const conditionMap = {
    "📘 New": "new",
    "👍 Good": "good",
    "👌 Fair": "fair",
    "😕 Poor": "poor",
  };
  return conditionMap[text] || text.toLowerCase();
};

// Process yes/no selection
const processYesNoInput = (text) => {
  if (text === "✅ Yes") return "yes";
  if (text === "❌ No") return "no";
  return text.toLowerCase();
};

export const handleKeyboardInput = async (ctx, next) => {
  if (!ctx.message?.text) return next();

  const text = ctx.message.text;
  
  // Log incoming button presses to help with debugging
  global.app.logger.debug(`Button pressed: "${text}", Current state: ${ctx.session?.state}`);
  
  // Handle profile-related states
  const profileStates = ["profile_menu", "manage_books", "confirm_delete_book"];
  if (profileStates.includes(ctx.session?.state)) {
    // Check if we're handling toggle status or manage books
    if (text === "🔄 Toggle Status" || text === "📚 Manage Books" || 
        text === "📕 Add Book" || text.startsWith("❌ Book") || 
        text === "🔙 Back to Profile" || 
        text.startsWith("✅ Yes") || text === "❌ No, keep it") {
      global.app.logger.debug(`Handling profile management action: "${text}"`);
      await handleProfileManagement(ctx);
      return;
    }
  }
  
  // Handle "Cancel Registration" button during registration
  if (text === "🔙 Cancel Registration" && ctx.session?.state === "registration") {
    ctx.session.state = "idle";
    ctx.session.step = 0;
    ctx.session.tempData = {};
    await ctx.reply("Registration cancelled. You can start over anytime.", {
      reply_markup: getMainKeyboard()
    });
    return;
  }
  
  // Handle "Cancel" button during add book
  if (text === "🔙 Cancel" && ctx.session?.state === "adding_book") {
    ctx.session.state = "idle";
    ctx.session.step = 0;
    ctx.session.tempData = {};
    await ctx.reply("Adding book cancelled.", {
      reply_markup: getMainKeyboard()
    });
    return;
  }
  
  // Special handling for browsing state - process Like and Skip actions
  if (ctx.session?.state === "browsing") {
    if (text === "👍 Like" || text === "👎 Skip") {
      await handleBrowseAction(ctx);
      return;
    } else if (text === "🔙 Back to Main Menu") {
      ctx.session.state = "idle";
      ctx.session.browsing = { currentUserId: null };
      await ctx.reply("Browsing cancelled.", { reply_markup: getMainKeyboard() });
      return;
    }
  }
  
  // For regular menu buttons
  const handler = keyboardActions[text];
  if (handler) {
    await handler(ctx);
    return;
  }

  // For adding book flow, translate button inputs to plain text
  if (ctx.session?.state === "adding_book" && ctx.session.step === 3) {
    // Replace the message text with the corresponding condition
    ctx.message.text = processConditionInput(text);
  }

  // For registration flow, handle yes/no responses
  if (ctx.session?.state === "registration" && ctx.session.step === 4) {
    ctx.message.text = processYesNoInput(text);
  }

  // If we get here, log that we're passing to the next middleware
  global.app.logger.debug(`No handler found for "${text}", passing to next middleware`);
  
  // Continue to the next middleware
  return next();
};