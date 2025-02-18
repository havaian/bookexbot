// src/commands/browse.js
import { User } from "../models/user.js";
import { Like } from "../models/like.js";
import { Match } from "../models/match.js";
import { cacheService } from "../services/cache.js";

async function findNextBook(currentUserId) {
  try {
    // Get users already liked
    const likes = await Like.find({ fromUser: currentUserId });
    const likedUserIds = likes.map((like) => like.toUser);
    
    // Get recently viewed users from cache
    const recentlyViewed = cacheService.getBrowseHistory(currentUserId) || [];
    
    global.app.logger.debug("Finding next book:", {
      currentUserId,
      likedUserIds,
      recentlyViewed,
    });

    // Find all eligible users
    const query = {
      $match: {
        telegramId: { 
          $ne: currentUserId, 
          $nin: [...likedUserIds, ...recentlyViewed] 
        },
        status: "active",
        "books.0": { $exists: true }
      }
    };

    global.app.logger.debug("Aggregate query:", query);

    const users = await User.aggregate([
      query,
      { $sample: { size: 1 } }
    ]);

    global.app.logger.debug("Found users:", users);

    if (!users || users.length === 0) {
      // If no new users, clear history and try again without recently viewed filter
      if (recentlyViewed.length > 0) {
        global.app.logger.debug("No users found, clearing history and retrying");
        cacheService.clearBrowseHistory(currentUserId);
        return findNextBook(currentUserId);
      }
      global.app.logger.debug("No users found even after clearing history");
      return null;
    }

    // Add to recently viewed
    cacheService.addToBrowseHistory(currentUserId, users[0].telegramId);
    
    return users[0];
  } catch (error) {
    global.app.logger.error("Error in findNextBook:", error);
    throw error;  // Re-throw to be handled by the caller
  }
}

// Show book to user with enhanced error handling
async function showBook(ctx, user) {
  try {
    const book = user.books[0];
    const message = `📚 Book Available:\n\n` +
      `Title: ${book.title}\n` +
      `Author: ${book.author}\n` +
      `Condition: ${book.condition || 'Not specified'}\n\n` +
      `What do you think?`;

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "👎 Skip", callback_data: `skip_${user.telegramId}` },
            { text: "👍 Like", callback_data: `like_${user.telegramId}` },
          ],
        ],
      },
    });
  } catch (error) {
    global.app.logger.error("❌ Error showing book:", error);
    await ctx.reply("Sorry, there was an error displaying this book. Use /browse to try again.");
  }
}

export const handleBrowse = async (ctx) => {
  try {
    const currentUser = await User.findOne({ telegramId: ctx.from.id });
    if (!currentUser) {
      return await ctx.reply("Please use /start to register first!");
    }

    const nextBook = await findNextBook(ctx.from.id);
    if (!nextBook) {
      return await ctx.reply("No more books available right now. Check back later! 📚");
    }

    await showBook(ctx, nextBook);
  } catch (error) {
    global.app.logger.error("❌ Browse command error:", error);
    await ctx.reply("Sorry, something went wrong. Please try again later.");
  }
};

// Handle like/skip actions
export const handleBrowseAction = async (ctx) => {
  try {
    const [action, userId] = ctx.callbackQuery.data.split("_");
    const targetUserId = parseInt(userId);

    if (action === "like") {
      // Create new like
      await Like.create({
        fromUser: ctx.from.id,
        toUser: targetUserId,
      });

      // Check for mutual like
      const mutualLike = await Like.findOne({
        fromUser: targetUserId,
        toUser: ctx.from.id,
      });

      if (mutualLike) {
        // Create new match
        await Match.create({
          users: [ctx.from.id, targetUserId],
        });

        // Notify user about the match
        await ctx.reply(
          "It's a match! 🎉\n" +
            "You both liked each other's books!\n" +
            "Use /matches to see all your matches and start a conversation."
        );
      }
    }

    // Show next book
    const nextBook = await findNextBook(ctx.from.id);
    if (nextBook) {
      await showBook(ctx, nextBook);
    } else {
      await ctx.reply(
        "No more books available right now. Check back later! 📚"
      );
    }
  } catch (error) {
    global.app.logger.error("❌ Browse action error:", error);
    await ctx.reply("Sorry, something went wrong. Please try again.");
  }
};
