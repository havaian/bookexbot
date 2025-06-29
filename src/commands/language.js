// src/commands/language.js
import { User } from "../models/user.js";
import { getLanguageKeyboard, getMainKeyboard } from "../utils/keyboard.js";
import { t, AVAILABLE_LANGUAGES } from "../utils/localization.js";

export const handleLanguage = async (ctx) => {
  try {
    // Check if user exists
    const user = await User.findOne({ telegramId: ctx.from.id });

    // Set the state to language selection
    ctx.session.state = "language_selection";

    // Display language selection keyboard
    await ctx.reply(t("language_selection", user?.language), {
      reply_markup: getLanguageKeyboard(),
    });
  } catch (error) {
    global.app.logger.error("❌ Language command error:", error);
    await ctx.reply(t("error_generic", ctx.session?.language), {
      reply_markup: getMainKeyboard(ctx.session?.language),
    });
  }
};

// Handle language selection
export const handleLanguageSelection = async (ctx) => {
  try {
    const selectedLanguage = ctx.message.text;

    // Find language code by name
    const langCode = Object.entries(AVAILABLE_LANGUAGES).find(
      ([code, name]) => name === selectedLanguage
    )?.[0];

    if (!langCode) {
      // If "Back / Назад" is pressed or invalid selection
      if (selectedLanguage === "🔙 Back / Назад") {
        ctx.session.state = "idle";
        return await ctx.reply(t("main_menu", ctx.session?.language), {
          reply_markup: getMainKeyboard(ctx.session?.language),
        });
      }

      // Invalid language selection
      return await ctx.reply(t("error_invalid_input", ctx.session?.language), {
        reply_markup: getLanguageKeyboard(),
      });
    }

    // Update user language preference
    const user = await User.findOne({ telegramId: ctx.from.id });
    if (user) {
      user.language = langCode;
      await user.save();
    }

    // Update session language
    ctx.session.language = langCode;

    // Reset state
    ctx.session.state = "idle";

    // Confirm language selection
    await ctx.reply(t("language_selected", langCode), {
      reply_markup: getMainKeyboard(langCode),
    });
  } catch (error) {
    global.app.logger.error("❌ Language selection error:", error);
    ctx.session.state = "idle";
    await ctx.reply(t("error_generic", ctx.session?.language), {
      reply_markup: getMainKeyboard(ctx.session?.language),
    });
  }
};
