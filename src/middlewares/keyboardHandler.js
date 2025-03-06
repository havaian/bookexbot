// src/middlewares/keyboardHandler.js
import { handleStart, handleInitialLanguageSelection } from "../commands/start.js";
import { handleProfile } from "../commands/profile.js";
import { handleBrowse, handleBrowseAction } from "../commands/browse.js";
import { handleAddBook } from "../commands/add.js";
import { handleHelp } from "../commands/help.js";
import { handleLanguage, handleLanguageSelection } from "../commands/language.js";
import { handleProfileManagement } from "../handlers/profileManager.js";
import { getMainKeyboard } from "../utils/keyboard.js";
import { t, AVAILABLE_LANGUAGES } from "../utils/localization.js";
import { User } from "../models/user.js";

// Map keyboard buttons to their corresponding handler functions based on language
const getKeyboardAction = (text, langCode) => {
  const actions = {
    [t("menu_browse", langCode)]: handleBrowse,
    [t("menu_profile", langCode)]: handleProfile,
    [t("menu_help", langCode)]: handleHelp,
    [t("menu_language", langCode)]: handleLanguage,
    [t("back_to_main", langCode)]: async (ctx) => {
      ctx.session.state = "idle";
      ctx.session.step = 0;
      ctx.session.tempData = {};
      if (ctx.session.browsing) {
        ctx.session.browsing = { currentUserId: null };
      }
      await ctx.reply(t("main_menu", langCode), { 
        reply_markup: getMainKeyboard(langCode) 
      });
    },
    ["🔙 Back / Назад"]: async (ctx) => {
      ctx.session.state = "idle";
      ctx.session.step = 0;
      ctx.session.tempData = {};
      if (ctx.session.browsing) {
        ctx.session.browsing = { currentUserId: null };
      }
      await ctx.reply(t("main_menu", langCode), { 
        reply_markup: getMainKeyboard(langCode) 
      });
    }
  };
  
  return actions[text];
};

// Process condition selection for adding books
const processConditionInput = (text, langCode) => {
  const conditionMap = {
    [t("condition_new", langCode)]: "new",
    [t("condition_good", langCode)]: "good",
    [t("condition_fair", langCode)]: "fair",
    [t("condition_poor", langCode)]: "poor",
  };
  return conditionMap[text] || text.toLowerCase();
};

// Process yes/no selection
const processYesNoInput = (text, langCode) => {
  if (text === t("yes", langCode)) return "yes";
  if (text === t("no", langCode)) return "no";
  return text.toLowerCase();
};

export const handleKeyboardInput = async (ctx, next) => {
  if (!ctx.message?.text) return next();

  const text = ctx.message.text;
  
  try {
    // Log all incoming messages with their context for debugging
    global.app.logger.debug(`Received text: "${text}", Current state: ${ctx.session?.state}, Step: ${ctx.session?.step}`);
    
    // Try to get user's language preference from session or database
    let langCode = ctx.session?.language;
    if (!langCode) {
      const user = await User.findOne({ telegramId: ctx.from.id });
      if (user && user.language) {
        langCode = user.language;
        ctx.session.language = langCode;
      }
    }
    
    // Handle emergency reset command (can be triggered from any state)
    if (text === "/reset") {
      ctx.session.state = "idle";
      ctx.session.step = 0;
      ctx.session.tempData = {};
      if (ctx.session.browsing) {
        ctx.session.browsing = { currentUserId: null };
      }
      await ctx.reply("Bot state has been reset. You can now use the main menu again.", {
        reply_markup: getMainKeyboard(langCode)
      });
      return;
    }

    // For main menu buttons, these should work from any state
    if (text === t("menu_browse", langCode) || 
        text === t("menu_profile", langCode) || 
        text === t("menu_help", langCode) || 
        text === t("menu_language", langCode)) {
      
      const handler = getKeyboardAction(text, langCode);
      if (handler) {
        // Reset any previous state
        ctx.session.state = "idle";
        ctx.session.step = 0;
        ctx.session.tempData = {};
        if (ctx.session.browsing) {
          ctx.session.browsing = { currentUserId: null };
        }
        
        await handler(ctx);
        return;
      }
    }
    
    // For back to main menu, this should work from any state
    if (text === t("back_to_main", langCode) || text === "🔙 Back / Назад") {
      const handler = getKeyboardAction(text, langCode);
      if (handler) {
        await handler(ctx);
        return;
      }
    }
  
    // Log incoming button presses to help with debugging
    global.app.logger.debug(`Processing button: "${text}", Current state: ${ctx.session?.state}, Language: ${langCode}`);
    
    // Handle initial language selection for new users
    if (ctx.session?.state === "initial_language_selection") {
      await handleInitialLanguageSelection(ctx);
      return;
    }
    
    // Handle language selection
    if (ctx.session?.state === "language_selection") {
      await handleLanguageSelection(ctx);
      return;
    }
    
    // Handle profile-related states
    const profileStates = ["profile_menu", "manage_books", "confirm_delete_book"];
    if (profileStates.includes(ctx.session?.state)) {
      // Check if we're handling toggle status or manage books
      if (text === t("profile_toggle_status", langCode) || 
          text === t("profile_manage_books", langCode) || 
          text === t("profile_add_book", langCode) || 
          text.startsWith(t("delete_book_prefix", langCode)) || 
          text === t("back_to_profile", langCode) || 
          text.startsWith(t("delete_confirm_prefix", langCode)) || 
          text === t("delete_reject", langCode)) {
        global.app.logger.debug(`Handling profile management action: "${text}"`);
        await handleProfileManagement(ctx);
        return;
      }
    }
    
    // Handle "Cancel Registration" button during registration
    if (text === t("cancel_registration", langCode) && ctx.session?.state === "registration") {
      ctx.session.state = "idle";
      ctx.session.step = 0;
      ctx.session.tempData = {};
      await ctx.reply(t("registration_cancelled", langCode), {
        reply_markup: getMainKeyboard(langCode)
      });
      return;
    }
    
    // Handle "Cancel" button during add book
    if (text === t("cancel", langCode) && ctx.session?.state === "adding_book") {
      ctx.session.state = "idle";
      ctx.session.step = 0;
      ctx.session.tempData = {};
      await ctx.reply(t("book_add_cancelled", langCode), {
        reply_markup: getMainKeyboard(langCode)
      });
      return;
    }
    
    // Special handling for browsing state - process Like and Skip actions
    if (ctx.session?.state === "browsing") {
      // Ensure there's a current user in session
      if (!ctx.session.browsing || !ctx.session.browsing.currentUserId) {
        global.app.logger.warn(`Browse action without currentUserId in session: ${JSON.stringify(ctx.session)}`);
        ctx.session.state = "idle";
        await ctx.reply(t("browse_session_expired", langCode), { 
          reply_markup: getMainKeyboard(langCode)
        });
        return;
      }
      
      if (text === t("browse_like", langCode) || text === t("browse_skip", langCode)) {
        global.app.logger.debug(`Processing browse action: ${text}`);
        await handleBrowseAction(ctx);
        return;
      } else if (text === t("back_to_main", langCode)) {
        ctx.session.state = "idle";
        ctx.session.browsing = { currentUserId: null };
        await ctx.reply(t("browse_cancelled", langCode), { 
          reply_markup: getMainKeyboard(langCode)
        });
        return;
      }
    }

    // For adding book flow, translate button inputs to plain text
    if (ctx.session?.state === "adding_book" && ctx.session.step === 3) {
      // Replace the message text with the corresponding condition
      ctx.message.text = processConditionInput(text, langCode);
      global.app.logger.debug(`Processed condition input: "${text}" -> "${ctx.message.text}"`);
    }

    // For registration flow, handle yes/no responses
    if (ctx.session?.state === "registration" && ctx.session.step === 4) {
      ctx.message.text = processYesNoInput(text, langCode);
      global.app.logger.debug(`Processed yes/no input: "${text}" -> "${ctx.message.text}"`);
    }

    // If we get here, log that we're passing to the next middleware
    global.app.logger.debug(`No specific keyboard handler found for "${text}" in state "${ctx.session?.state}", passing to next middleware`);
  
  } catch (error) {
    global.app.logger.error("Keyboard handler error:", error);
    
    // Reset session to prevent getting stuck
    ctx.session.state = "idle";
    ctx.session.step = 0;
    ctx.session.tempData = {};
    if (ctx.session.browsing) {
      ctx.session.browsing = { currentUserId: null };
    }
    
    await ctx.reply(t("error_generic", ctx.session?.language), {
      reply_markup: getMainKeyboard(ctx.session?.language)
    });
  }
  
  // Continue to the next middleware
  return next();
};