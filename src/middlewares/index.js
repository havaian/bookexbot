// src/middlewares/index.js
import { handleRegistrationStep } from '../handlers/registration.js';
import { handleAddBookStep } from '../commands/add.js';
import { handleProfileManagement } from '../handlers/profileManager.js';
import { handleInitialLanguageSelection } from '../commands/start.js';
import { handleLanguageSelection } from '../commands/language.js';
import { handleKeyboardInput } from './keyboardHandler.js';
import { getMainKeyboard } from '../utils/keyboard.js';
import { handleBrowseAction } from '../commands/browse.js';
import { t } from '../utils/localization.js';

export const stateHandler = async (ctx, next) => {
  try {
    console.log(ctx);

    // Always log the current state for debugging
    global.app.logger.info(`Processing message in state: ${ctx.session?.state}, step: ${ctx.session?.step}`);
    
    // First process any keyboard input
    await handleKeyboardInput(ctx, async () => {
      if (ctx.message?.text) {
        const currentState = ctx.session?.state || 'idle';
        
        switch (currentState) {
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
          case 'browsing':
            // Make sure browsing state handles text inputs properly
            if (ctx.message.text.startsWith('👍') || ctx.message.text.startsWith('👎')) {
              await handleBrowseAction(ctx);
            } else {
              await next();
            }
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
    
    // Always reset session on error to prevent getting stuck
    if (ctx.session) {
      ctx.session.state = 'idle';
      ctx.session.step = 0;
      ctx.session.tempData = {};
      if (ctx.session.browsing) {
        ctx.session.browsing = { currentUserId: null };
      }
    }

    await ctx.reply(t('error_generic', ctx.session?.language), {
      reply_markup: getMainKeyboard(ctx.session?.language)
    });
  }
};