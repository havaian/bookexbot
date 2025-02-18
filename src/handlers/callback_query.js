import { handleBrowseAction } from "../commands/browse.js";

// Handle callback queries separately
export const handleCallbackQuery = async (ctx) => {
  try {
    if (ctx.callbackQuery) {
      await handleBrowseAction(ctx);
    }
  } catch (error) {
    global.app.logger.error(error);
  }
};
