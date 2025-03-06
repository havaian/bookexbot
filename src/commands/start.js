// src/commands/start.js
import { User } from "../models/user.js";
import { getLanguageKeyboard, getBackKeyboard, getMainKeyboard } from "../utils/keyboard.js";
import { t, DEFAULT_LANGUAGE } from "../utils/localization.js";

export const handleStart = async (ctx) => {
  const { from } = ctx;

  try {
    // Check if user already exists
    let user = await User.findOne({ telegramId: from.id });

    if (!user) {
      // Create new user with default language
      user = await User.create({
        telegramId: from.id,
        username: from.username,
        language: DEFAULT_LANGUAGE
      });

      // For new users, first show language selection
      ctx.session.state = "initial_language_selection";
      
      // Show language selection keyboard
      return await ctx.reply(
        t("welcome_message", DEFAULT_LANGUAGE),
        {
          reply_markup: getLanguageKeyboard()
        }
      );
    } else {
      // For existing users, show welcome back message
      const langCode = user.language || DEFAULT_LANGUAGE;
      
      // Store language in session for easy access
      ctx.session.language = langCode;
      
      // Show welcome back message
      await ctx.reply(
        t("main_menu", langCode),
        {
          reply_markup: getMainKeyboard(langCode)
        }
      );
    }
  } catch (error) {
    global.app.logger.error("❌ Start command error:", error);
    await ctx.reply(t("error_generic", DEFAULT_LANGUAGE), {
      reply_markup: getMainKeyboard(DEFAULT_LANGUAGE)
    });
  }
};

// Handle initial language selection for new users
export const handleInitialLanguageSelection = async (ctx) => {
  try {
    const selectedLanguage = ctx.message.text;
    
    // Find language code by name
    const langEntries = Object.entries(AVAILABLE_LANGUAGES);
    const langPair = langEntries.find(([code, name]) => name === selectedLanguage);
    
    if (!langPair) {
      // Invalid language selection
      return await ctx.reply(
        t("error_invalid_input", DEFAULT_LANGUAGE),
        {
          reply_markup: getLanguageKeyboard()
        }
      );
    }
    
    const langCode = langPair[0];
    
    // Update user language preference
    const user = await User.findOne({ telegramId: ctx.from.id });
    if (user) {
      user.language = langCode;
      await user.save();
    }
    
    // Update session language
    ctx.session.language = langCode;
    
    // Start registration flow
    ctx.session.state = "registration";
    ctx.session.step = 1;
    
    global.app.logger.debug(ctx.session);

    // Now start the registration process
    await ctx.reply(
      t("language_selected", langCode),
      {
        reply_markup: getMainKeyboard(langCode)
      }
    );
    
    // Send registration instructions
    await ctx.reply(
      t("registration_start", langCode),
      {
        reply_markup: getBackKeyboard(t("cancel_registration", langCode), langCode)
      }
    );
  } catch (error) {
    global.app.logger.error("❌ Language selection error:", error);
    ctx.session.state = "idle";
    await ctx.reply(
      t("error_generic", DEFAULT_LANGUAGE),
      {
        reply_markup: getMainKeyboard(DEFAULT_LANGUAGE)
      }
    );
  }
};