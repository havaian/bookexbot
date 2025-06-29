// src/commands/browse.js
import { User } from "../models/user.js";
import { Like } from "../models/like.js";
import { Match } from "../models/match.js";
import { cacheService } from "../services/cache.js";
import { getBrowseKeyboard, getMainKeyboard } from "../utils/keyboard.js";
import { t, formatCondition } from "../utils/localization.js";

let botInstance = null;
export const setBotInstance = (bot) => {
  botInstance = bot;
};

// Store the current user being viewed in the session
const storeCurrentBrowseUser = (ctx, user) => {
  ctx.session.browsing = {
    currentUserId: user.telegramId,
    startTime: Date.now() // Add timestamp for expiration tracking
  };
};

// Reset browsing state to prevent getting stuck
export const resetBrowsingState = async (ctx) => {
  try {
    const langCode = ctx.session?.language;
    ctx.session.state = "idle";
    ctx.session.browsing = { currentUserId: null };
    
    await ctx.reply(t("browse_session_expired", langCode) || "Browse session expired. Please try again.", {
      reply_markup: getMainKeyboard(langCode)
    });
    
    global.app.logger.info(`Reset browsing state for user ${ctx.from?.id}`);
  } catch (error) {
    global.app.logger.error("Error resetting browsing state:", error);
  }
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
    
    global.app.logger.info("Finding next user:", {
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

    global.app.logger.info("Aggregate query:", JSON.stringify(query));

    const users = await User.aggregate([
      query,
      { $sample: { size: 1 } }
    ]);

    global.app.logger.info("Found users:", users.length);

    if (!users || users.length === 0) {
      global.app.logger.info("No users found");
      return null;
    }
    
    return users[0];
  } catch (error) {
    global.app.logger.error("Error in findNextUser:", error);
    throw error;  // Re-throw to be handled by the caller
  }
}

// Format all user books for display
function formatUserBooks(user, langCode) {
  let message = "";
  
  if (!user.books || !Array.isArray(user.books)) {
    return "No books available";
  }
  
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
    
    global.app.logger.info(`Showing books for user ${user.telegramId} to user ${ctx.from.id}`);
  } catch (error) {
    const langCode = ctx.session?.language;
    global.app.logger.error("❌ Error showing books:", error);
    
    // Reset state to prevent getting stuck
    ctx.session.state = "idle";
    ctx.session.browsing = { currentUserId: null };
    
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
      `${otherUser.firstName} ${otherUser.lastName || ""}`, 
      otherUser.books && otherUser.books[0] ? otherUser.books[0].title : "their book", 
      otherUser.books && otherUser.books[0] ? otherUser.books[0].author : "", 
      contactInfo);

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
    
    // Reset browsing state at the start to ensure clean state
    ctx.session.browsing = { currentUserId: null };
    ctx.session.state = "idle"; // Start with idle and only set to browsing when showing books
    
    global.app.logger.info(`Browse command started for user ${ctx.from.id}`);
    
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

    // Find the next user to show
    const nextUser = await findNextUser(ctx.from.id);
    if (!nextUser) {
      return await ctx.reply(t("browse_no_more_books", langCode), {
        reply_markup: getMainKeyboard(langCode)
      });
    }

    // Show the books
    await showUserBooks(ctx, nextUser);
    
    global.app.logger.info(`Browse command completed for user ${ctx.from.id}`);
  } catch (error) {
    const langCode = ctx.session?.language;
    global.app.logger.error("❌ Browse command error:", error);
    
    // Reset state to prevent getting stuck
    ctx.session.state = "idle";
    ctx.session.browsing = { currentUserId: null };
    
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

    global.app.logger.info(`Browse action started: ${action} by user ${ctx.from.id}`);

    // Get the current user being viewed from session
    if (!ctx.session.browsing || !ctx.session.browsing.currentUserId) {
      global.app.logger.warn(`Browse action without currentUserId in session: ${JSON.stringify(ctx.session)}`);
      return await resetBrowsingState(ctx);
    }

    // Check for session expiration (5 minutes)
    if (ctx.session.browsing.startTime && Date.now() - ctx.session.browsing.startTime > 300000) {
      global.app.logger.warn(`Browse session expired for user ${ctx.from.id}`);
      return await resetBrowsingState(ctx);
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
    global.app.logger.info(`User ${ctx.from.id} ${action}d user ${targetUserId}`);

    // Store the current state before processing to avoid race conditions
    const currentBrowsing = { ...ctx.session.browsing };

    // Immediately acknowledge the action to prevent double-clicking
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

        global.app.logger.info(`Mutual like check: ${mutualLike ? 'Match found!' : 'No match yet'}`);

        if (mutualLike) {
          // Check if match already exists
          const existingMatch = await Match.findOne({
            users: { $all: [ctx.from.id, targetUserId] }
          });

          if (!existingMatch) {
            try {
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
                  contactInfo));

                // Notify the other user
                if (botInstance) {
                  const notified = await notifyUserAboutMatch(botInstance, targetUserId, currentUser);

                  if (notified) {
                    global.app.logger.info(`Both users notified about match ${match._id}`);
                  } else {
                    global.app.logger.warn(`Could not notify other user ${targetUserId} about match ${match._id}`);
                  }
                } else {
                  global.app.logger.error("Bot instance not set, can't notify other user about match");
                }
              }
            } catch (error) {
              global.app.logger.error("Error creating match:", error);
            }
          } else {
            global.app.logger.info(`Match already exists between users ${ctx.from.id} and ${targetUserId}`);
          }
        }
      } else {
        global.app.logger.info(`User ${ctx.from.id} already liked user ${targetUserId}`);
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

    // Show next book with a small delay to ensure messages are in right order
    setTimeout(async () => {
      try {
        // Show next book
        const nextUser = await findNextUser(ctx.from.id);
        if (nextUser) {
          await showUserBooks(ctx, nextUser);
        } else {
          ctx.session.state = "idle";
          await ctx.reply(t("browse_no_more_books", langCode), {
            reply_markup: getMainKeyboard(langCode)
          });
        }
      } catch (error) {
        global.app.logger.error("❌ Error showing next user:", error);
        
        // Reset state to prevent getting stuck
        ctx.session.state = "idle";
        ctx.session.browsing = { currentUserId: null };
        
        await ctx.reply(t("browse_error_next", langCode), {
          reply_markup: getMainKeyboard(langCode)
        });
      }
    }, 500); // Small delay to ensure messages are received in the right order
  } catch (error) {
    const langCode = ctx.session?.language;
    global.app.logger.error("❌ Browse action error:", error);
    
    // Always reset state on error
    ctx.session.state = "idle";
    ctx.session.browsing = { currentUserId: null };
    
    await ctx.reply(t("error_generic", langCode), {
      reply_markup: getMainKeyboard(langCode)
    });
  }
};

// Add middleware to check for stuck sessions
export const checkBrowsingTimeout = async (ctx, next) => {
  try {
    // If user has been in browsing state for too long, reset it
    if (
      ctx.session?.state === "browsing" && 
      ctx.session?.browsing?.startTime && 
      Date.now() - ctx.session.browsing.startTime > 300000 // 5 minutes
    ) {
      global.app.logger.warn(`Browsing timeout for user ${ctx.from?.id}`);
      await resetBrowsingState(ctx);
      return;
    }
    
    await next();
  } catch (error) {
    global.app.logger.error("Error in browsing timeout check:", error);
    await next();
  }
};