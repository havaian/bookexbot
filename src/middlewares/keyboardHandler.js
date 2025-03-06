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
  
  // Log all inputs for debugging
  global.app.logger.info(`Processing text: "${text}", Language in session: ${langCode}`);
  
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