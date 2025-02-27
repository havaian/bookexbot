// src/middlewares/index.js
import { handleRegistrationStep } from '../handlers/registration.js';
import { handleAddBookStep } from '../commands/add.js';
import { handleProfileManagement } from '../handlers/profileManager.js';
import { handleInitialLanguageSelection } from '../commands/start.js';
import { handleLanguageSelection } from '../commands/language.js';
import { handleKeyboardInput } from './keyboardHandler.js';
import { getMainKeyboard } from '../utils/keyboard.js';
import { t } from '../utils/localization.js';

export const stateHandler = async (ctx, next) => {
  try {
    // Get user's language preference from session
    const langCode = ctx.session?.language;
    
    // First process any keyboard input
    await handleKeyboardInput(ctx, async () => {
      if (ctx.message?.text) {
        switch (ctx.session?.state) {
          case 'initial_language_selection':
            await handleInitialLanguageSelection(ctx);
            break;
          case 'language_selection':
            await handleLanguageSelection(ctx);
            break;
          case 'registration':
            await handleRegistrationStep(ctx);
            break;
          case 'adding_book':
            await handleAddBookStep(ctx);
            break;
          case 'profile_menu':
          case 'manage_books':
          case 'confirm_delete_book':
            await handleProfileManagement(ctx);
            break;
          default:
            await next();
        }
      } else {
        await next();
      }
    });
  } catch (error) {
    global.app.logger.error('State handler middleware error:', error, {
      state: ctx.session?.state,
      step: ctx.session?.step,
      userId: ctx.from?.id,
      language: ctx.session?.language
    });
    
    // Reset session on error
    if (ctx.session) {
      ctx.session.state = 'idle';
      ctx.session.step = 0;
      ctx.session.tempData = {};
    }

    await ctx.reply(t('error_generic', ctx.session?.language), {
      reply_markup: getMainKeyboard(ctx.session?.language)
    });
  }
};