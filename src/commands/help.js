// src/commands/help.js
import { getMainKeyboard } from "../utils/keyboard.js";
import { t } from "../utils/localization.js";

export const handleHelp = async (ctx) => {
  try {
    const langCode = ctx.session?.language;
    
    await ctx.reply(
      [
        t("help_title", langCode),
        "",
        t("help_intro", langCode),
        "",
        t("help_menu_items", langCode),
        "",
        t("help_profile", langCode),
        "",
        t("help_exchange", langCode),
        "",
        t("help_conclusion", langCode)
      ].join("\n"),
      {
        reply_markup: getMainKeyboard(langCode)
      }
    );
  } catch (error) {
    global.app.logger.error("Help command error:", error);
    await ctx.reply(t("error_generic", langCode), {
      reply_markup: getMainKeyboard(langCode)
    });
  }
};