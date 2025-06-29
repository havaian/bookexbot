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
  const langCode = ctx.session?.language || DEFAULT_LANGUAGE;
  
  global.app.logger.info(`Processing text: "${text}", Language in session: ${langCode}`);
  
  // First check if this is any kind of "back" button across all languages
  const isBackButton = (text) => {
    // Check in all available languages
    for (const lang of Object.keys(AVAILABLE_LANGUAGES)) {
      // Check for all possible back button variants
      const backVariants = [
        t("back_to_main", lang),
        t("back_to_profile", lang),
        t("cancel", lang),
        t("cancel_registration", lang),
        "🔙 Back / Назад"  // Special case for language selection
      ];
      
      if (backVariants.includes(text)) {
        return true;
      }
    }
    return false;
  };
  
  // Handle any button press when context is lost or invalid
  if (ctx.session.state === "idle" || !ctx.session.state) {
    if (isBackButton(text) || 
        text.includes("Back to Main") || 
        text.includes("Вернуться в меню")) {
      
      global.app.logger.info(`Restoring main menu for user with lost context: "${text}"`);
      
      // Check if user is registered
      try {
        const user = await User.findOne({ telegramId: ctx.from.id });
        if (user) {
          // User is registered, show main menu
          ctx.session.state = "idle";
          ctx.session.step = 0;
          ctx.session.tempData = {};
          ctx.session.language = user.language || DEFAULT_LANGUAGE;
          
          if (ctx.session.browsing) {
            ctx.session.browsing = { currentUserId: null };
          }
          
          await ctx.reply(t("main_menu", ctx.session.language), { 
            reply_markup: getMainKeyboard(ctx.session.language) 
          });
          return; // Stop processing
        } else {
          // User is not registered, restart registration
          return await handleStart(ctx);
        }
      } catch (error) {
        global.app.logger.error("Error checking user registration:", error);
        // If DB error, still try to show main menu with default language
        await ctx.reply(t("main_menu", DEFAULT_LANGUAGE), { 
          reply_markup: getMainKeyboard(DEFAULT_LANGUAGE) 
        });
        return;
      }
    }
  }
  
  // Check if this is a Russian button but session is in English or vice versa
  const isRussianButton = text.match(/[а-яА-Я]/) !== null;
  const targetLang = isRussianButton ? "ru" : "en";
  
  // Check standard menu buttons in both languages
  const menuActions = {
    "browse": [t("menu_browse", "en"), t("menu_browse", "ru")],
    "profile": [t("menu_profile", "en"), t("menu_profile", "ru")],
    "help": [t("menu_help", "en"), t("menu_help", "ru")],
    "language": [t("menu_language", "en"), t("menu_language", "ru")]
  };
  
  for (const [action, buttonTexts] of Object.entries(menuActions)) {
    if (buttonTexts.includes(text)) {
      global.app.logger.info(`Matched button "${text}" to action "${action}"`);
      
      // Reset to idle state
      ctx.session.state = "idle";
      ctx.session.step = 0;
      ctx.session.tempData = {};
      
      // Handle the action
      switch(action) {
        case "browse":
          return await handleBrowse(ctx);
        case "profile":
          return await handleProfile(ctx);
        case "help":
          return await handleHelp(ctx);
        case "language":
          return await handleLanguage(ctx);
      }
    }
  }
  
  // Continue to next middleware if no match
  global.app.logger.info(`No menu action found for text: "${text}"`);
  return next();
};