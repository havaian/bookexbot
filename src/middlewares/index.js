// src/middlewares/index.js
import { handleRegistrationStep } from '../handlers/registration.js';
import { handleAddBookStep } from '../commands/add.js';
import { handleProfileManagement } from '../handlers/profileManager.js';
import { handleKeyboardInput } from './keyboardHandler.js';
import { getMainKeyboard } from '../utils/keyboard.js';

export const stateHandler = async (ctx, next) => {
  try {
    // First process any keyboard input
    await handleKeyboardInput(ctx, async () => {
      if (ctx.message?.text) {
        switch (ctx.session?.state) {
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
      userId: ctx.from?.id
    });
    
    // Reset session on error
    if (ctx.session) {
      ctx.session.state = 'idle';
      ctx.session.step = 0;
      ctx.session.tempData = {};
    }

    await ctx.reply('Something went wrong. Please try again.', {
      reply_markup: getMainKeyboard()
    });
  }
};