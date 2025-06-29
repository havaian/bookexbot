// src/commands/status.js
import { User } from "../models/user.js";
import { getMainKeyboard } from "../utils/keyboard.js";
import { t } from "../utils/localization.js";

export const handleStatus = async (ctx) => {
  try {
    const langCode = ctx.session?.language;
    const user = await User.findOne({ telegramId: ctx.from.id });

    if (!user) {
      return await ctx.reply(t("error_not_registered", langCode), {
        reply_markup: getMainKeyboard(langCode)
      });
    }

    // Toggle status
    user.status = user.status === "active" ? "inactive" : "active";
    await user.save();

    const statusEmoji = user.status === "active" ? "🟢" : "🔴";
    await ctx.reply(
      t("profile_status", langCode, statusEmoji, t(`status_${user.status}_message`)),
      {
        reply_markup: getMainKeyboard(langCode)
      }
    );
  } catch (error) {
    global.app.logger.error("❌ Status command error:", error);
    await ctx.reply(t("error_generic", langCode), {
      reply_markup: getMainKeyboard(langCode)
    });
  }
};