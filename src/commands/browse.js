// src/commands/browse.js - updated to show all books and handle skips permanently
import { User } from "../models/user.js";
import { Like } from "../models/like.js";
import { Match } from "../models/match.js";
import { cacheService } from "../services/cache.js";
import { getBrowseKeyboard, getMainKeyboard } from "../utils/keyboard.js";
import { t, formatCondition } from "../utils/localization.js";

// Store the current user being viewed in the session
const storeCurrentBrowseUser = (ctx, user) => {
  ctx.session.browsing = {
    currentUserId: user.telegramId
  };
};

async function findNextUser(currentUserId) {
  try {
    // Get users already liked
    const likes = await Like.find({ fromUser: currentUserId });
    const likedUserIds = likes.map((like) => like.toUser);
    
    // Get skipped users - we'll store them in a permanent collection now
    const skips = await Like.find({ 
      fromUser: currentUserId,
      action: "skip" // New field to distinguish skips from likes
    });
    const skippedUserIds = skips.map((skip) => skip.toUser);
    
    // Get recently viewed users from cache - not needed anymore since we persist skips
    // const recentlyViewed = cacheService.getBrowseHistory(currentUserId) || [];
    
    global.app.logger.debug("Finding next user:", {
      currentUserId,
      likedUserIds: likedUserIds.length,
      skippedUserIds: skippedUserIds.length
    });

    // Find all eligible users - exclude both liked and skipped users
    const query = {
      $match: {
        telegramId: { 
          $ne: currentUserId, 
          $nin: [...likedUserIds, ...skippedUserIds] 
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

    global.app.logger.debug("Found users:", users.length);

    if (!users || users.length === 0) {
      global.app.logger.debug("No users found");
      return null;
    }
    
    // No need to add to cache since we'll persist skips in the database
    // cacheService.addToBrowseHistory(currentUserId, users[0].telegramId);
    
    return users[0];
  } catch (error) {
    global.app.logger.error("Error in findNextUser:", error);
    throw error;  // Re-throw to be handled by the caller
  }
}

// Format all user books for display
function formatUserBooks(user, langCode) {
  let message = "";
  
  user.books.forEach((book, index) => {
    message += `📚 ${t("book_item", langCode, index + 1, book.title, book.author, formatCondition(book.condition, langCode))}\n\n`;
  });
  
  return message;
}

// Show all books from user with enhanced error handling
async function showUserBooks(ctx, user) {
  try {
    const langCode = ctx.session?.language;
    
    // Create a message showing all of the user's books
    const message = `${t("browse_user_header", langCode, user.firstName)}\n\n` +
      formatUserBooks(user, langCode) +
      `\n${t("browse_question", langCode)}`;

    // Store the current user in session
    storeCurrentBrowseUser(ctx, user);
    ctx.session.state = "browsing";

    await ctx.reply(message, {
      reply_markup: getBrowseKeyboard(langCode)
    });
  } catch (error) {
    const langCode = ctx.session?.language;
    global.app.logger.error("❌ Error showing books:", error);
    await ctx.reply(t("browse_error", langCode), {
      reply_markup: getMainKeyboard(langCode)
    });
  }
}

// Send match notification to a user
async function notifyUserAboutMatch(bot, userId, otherUser) {
  try {
    const user = await User.findOne({ telegramId: userId });
    const langCode = user?.language;
    
    // Get contact info for the notification
    const contactInfo = otherUser.username 
      ? `@${otherUser.username}` 
      : t("match_no_username", langCode);
    
    // Create a message showing the other user's books
    const booksMessage = formatUserBooks(otherUser, langCode);
    
    // Create a more detailed match message with contact instructions
    const message = t("match_notification_other", langCode,
      `${otherUser.firstName} ${otherUser.lastName || ""}`, booksMessage, contactInfo);

    // Send the message with the main keyboard
    const sentMessage = await bot.api.sendMessage(userId, message, {
      reply_markup: getMainKeyboard(langCode)
    });
    
    global.app.logger.info(`Match notification sent to user ${userId} - Message ID: ${sentMessage.message_id}`);
    return true;
  } catch (error) {
    global.app.logger.error(`❌ Failed to send match notification to user ${userId}:`, error);
    return false;
  }
}

export const handleBrowse = async (ctx) => {
  try {
    const langCode = ctx.session?.language;
    const currentUser = await User.findOne({ telegramId: ctx.from.id });
    if (!currentUser) {
      return await ctx.reply(t("error_not_registered", langCode), {
        reply_markup: getMainKeyboard(langCode)
      });
    }

    // Check if user has at least one book
    if (!currentUser.books || currentUser.books.length === 0) {
      return await ctx.reply(t("browse_no_books", langCode), {
        reply_markup: getMainKeyboard(langCode)
      });
    }

    const nextUser = await findNextUser(ctx.from.id);
    if (!nextUser) {
      return await ctx.reply(t("browse_no_more_books", langCode), {
        reply_markup: getMainKeyboard(langCode)
      });
    }

    await showUserBooks(ctx, nextUser);
  } catch (error) {
    const langCode = ctx.session?.language;
    global.app.logger.error("❌ Browse command error:", error);
    await ctx.reply(t("error_generic", langCode), {
      reply_markup: getMainKeyboard(langCode)
    });
  }
};

// Handle like/skip actions from keyboard
export const handleBrowseAction = async (ctx) => {
  try {
    const langCode = ctx.session?.language;
    const action = ctx.message.text.startsWith(t("browse_like", langCode).substring(0, 2)) ? "like" : "skip";

    // Get the current user being viewed from session
    if (!ctx.session.browsing || !ctx.session.browsing.currentUserId) {
      return await ctx.reply(t("browse_session_expired", langCode), {
        reply_markup: getMainKeyboard(langCode)
      });
    }

    // Verify the current user has books
    const currentUser = await User.findOne({ telegramId: ctx.from.id });
    if (!currentUser || !currentUser.books || currentUser.books.length === 0) {
      ctx.session.state = "idle";
      ctx.session.browsing = { currentUserId: null };
      return await ctx.reply(t("browse_no_books", langCode), {
        reply_markup: getMainKeyboard(langCode)
      });
    }
    
    const targetUserId = ctx.session.browsing.currentUserId;

    global.app.logger.debug(`User ${ctx.from.id} ${action}d user ${targetUserId}`);

    // Store the current state before processing to avoid race conditions
    const currentBrowsing = { ...ctx.session.browsing };

    // Immediately acknowledge the action
    let acknowledgeMsg = action === "like" 
      ? t("browse_liked", langCode) 
      : t("browse_skipped", langCode);
    await ctx.reply(acknowledgeMsg);

    // Reset session browsing state to prevent double processing
    ctx.session.state = "idle";
    ctx.session.browsing = { currentUserId: null };

    // Process action
    if (action === "like") {
      // Check if like already exists (prevent duplicates)
      const existingLike = await Like.findOne({
        fromUser: ctx.from.id,
        toUser: targetUserId,
        action: "like"
      });

      if (!existingLike) {
        // Create new like
        await Like.create({
          fromUser: ctx.from.id,
          toUser: targetUserId,
          action: "like"
        });

        global.app.logger.info(`Like created: User ${ctx.from.id} liked user ${targetUserId}`);

        // Check for mutual like
        const mutualLike = await Like.findOne({
          fromUser: targetUserId,
          toUser: ctx.from.id,
          action: "like"
        });

        global.app.logger.debug(`Mutual like check: ${mutualLike ? 'Match found!' : 'No match yet'}`);

        if (mutualLike) {
          // Check if match already exists
          const existingMatch = await Match.findOne({
            users: { $all: [ctx.from.id, targetUserId] }
          });

          if (!existingMatch) {
            // Create new match
            const match = await Match.create({
              users: [ctx.from.id, targetUserId],
              status: "active"
            });

            global.app.logger.info(`Match created: ${match._id} between users ${ctx.from.id} and ${targetUserId}`);

            // Get target user's information for notifications
            const targetUser = await User.findOne({ telegramId: targetUserId });

            if (currentUser && targetUser) {
              // Format books message for notification
              const booksMessage = formatUserBooks(targetUser, langCode);
              
              // Get contact info
              const contactInfo = targetUser.username 
                ? `@${targetUser.username}` 
                : t("match_no_username", langCode);
              
              // Notify the current user
              await ctx.reply(t("match_notification", langCode,
                `${targetUser.firstName} ${targetUser.lastName || ""}`,
                booksMessage,
                contactInfo));

              // Notify the other user
              const notified = await notifyUserAboutMatch(ctx.bot, targetUserId, currentUser);

              if (notified) {
                global.app.logger.info(`Both users notified about match ${match._id}`);
              } else {
                global.app.logger.warn(`Could not notify other user ${targetUserId} about match ${match._id}`);
              }
            }
          } else {
            global.app.logger.debug(`Match already exists between users ${ctx.from.id} and ${targetUserId}`);
          }
        }
      } else {
        global.app.logger.debug(`User ${ctx.from.id} already liked user ${targetUserId}`);
      }
    } else if (action === "skip") {
      // Store skip permanently in database 
      const existingSkip = await Like.findOne({
        fromUser: ctx.from.id,
        toUser: targetUserId,
        action: "skip"
      });
      
      if (!existingSkip) {
        // Create new skip record
        await Like.create({
          fromUser: ctx.from.id,
          toUser: targetUserId,
          action: "skip"
        });
        global.app.logger.info(`Skip created: User ${ctx.from.id} skipped user ${targetUserId}`);
      }
    }

    // Wait a moment before showing the next book
    setTimeout(async () => {
      try {
        // Show next book
        const nextUser = await findNextUser(ctx.from.id);
        if (nextUser) {
          await showUserBooks(ctx, nextUser);
        } else {
          await ctx.reply(t("browse_no_more_books", langCode), {
            reply_markup: getMainKeyboard(langCode)
          });
        }
      } catch (error) {
        global.app.logger.error("❌ Error showing next user:", error);
        await ctx.reply(t("browse_error_next", langCode), {
          reply_markup: getMainKeyboard(langCode)
        });
      }
    }, 500); // Small delay to ensure messages are received in the right order
  } catch (error) {
    const langCode = ctx.session?.language;
    global.app.logger.error("❌ Browse action error:", error);
    ctx.session.state = "idle";
    ctx.session.browsing = { currentUserId: null };
    await ctx.reply(t("error_generic", langCode), {
      reply_markup: getMainKeyboard(langCode)
    });
  }
};