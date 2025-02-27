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
      await ctx.reply(t("main_menu", langCode), { 
        reply_markup: getMainKeyboard(langCode) 
      });
    },
    ["🔙 Back / Назад"]: async (ctx) => {
      ctx.session.state = "idle";
      ctx.session.step = 0;
      ctx.session.tempData = {};
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
    // Try to get user's language preference from session or database
    let langCode = ctx.session?.language;
    if (!langCode) {
      const user = await User.findOne({ telegramId: ctx.from.id });
      if (user && user.language) {
        langCode = user.language;
        ctx.session.language = langCode;
      }
    }

    // For regular menu buttons
    const handler = getKeyboardAction(text, langCode);
    if (handler) {
      await handler(ctx);
      return;
    }
  
    // Log incoming button presses to help with debugging
    global.app.logger.debug(`Button pressed: "${text}", Current state: ${ctx.session?.state}, Language: ${langCode}`);
    
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
      if (text === t("browse_like", langCode) || text === t("browse_skip", langCode)) {
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
    }

    // For registration flow, handle yes/no responses
    if (ctx.session?.state === "registration" && ctx.session.step === 4) {
      ctx.message.text = processYesNoInput(text, langCode);
    }

    // If we get here, log that we're passing to the next middleware
    global.app.logger.debug(`No handler found for "${text}", passing to next middleware`);
  
  } catch (error) {
    global.app.logger.error("Keyboard handler error:", error);
  }
  
  // Continue to the next middleware
  return next();
};