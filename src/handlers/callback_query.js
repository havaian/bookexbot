import { handleBrowse } from "../commands/browse.js";

// Handle callback queries separately
export const handleCallbackQuery = async (ctx) => {
  try {
    if (ctx.callbackQuery) {
      await handleBrowse.handleBrowseAction(ctx);
    }
  } catch (error) {
    global.app.logger.error(error);
  }
};
