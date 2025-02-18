// src/utils/validation.js
export const validateBook = (book) => {
  if (!book.title || typeof book.title !== "string") return false;
  if (!book.author || typeof book.author !== "string") return false;
  if (book.condition && !BOOK_CONDITIONS.includes(book.condition)) return false;
  return true;
};

// src/middlewares/errorHandler.js
export const errorHandler = async (error, ctx) => {
  global.app.logger.error(`❌ Error for ${ctx.update.update_id}:`, error);

  try {
    await ctx.reply(
      "Sorry, something went wrong. Please try again or use /help for available commands."
    );
  } catch (e) {
    global.app.logger.error("❌ Error sending error message:", e);
  }
};
