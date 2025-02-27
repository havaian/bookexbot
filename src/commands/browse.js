// src/commands/browse.js
import { User } from "../models/user.js";
import { Like } from "../models/like.js";
import { Match } from "../models/match.js";
import { cacheService } from "../services/cache.js";
import { getBrowseKeyboard, getMainKeyboard } from "../utils/keyboard.js";

// Store the current user being viewed in the session
const storeCurrentBrowseUser = (ctx, user) => {
  ctx.session.browsing = {
    currentUserId: user.telegramId
  };
};

let botInstance = null;

export const setBotInstance = (bot) => {
  botInstance = bot;
};

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

    // Store the current user in session
    storeCurrentBrowseUser(ctx, user);
    ctx.session.state = "browsing";

    await ctx.reply(message, {
      reply_markup: getBrowseKeyboard()
    });
  } catch (error) {
    global.app.logger.error("❌ Error showing book:", error);
    await ctx.reply("Sorry, there was an error displaying this book. Use the Browse button to try again.", {
      reply_markup: getMainKeyboard()
    });
  }
}

// Send match notification to a user
async function notifyUserAboutMatch(bot, userId, otherUser) {
  try {
    // Get a book from the other user for the notification
    const book = otherUser.books[0];
    
    // Create username display for contact
    const contactInfo = otherUser.username 
      ? `@${otherUser.username}` 
      : "this user (they don't have a username)";
    
    // Create a more detailed match message with contact instructions
    const message = `🎉 Book Match! 🎉\n\n` +
      `You've matched with ${otherUser.firstName} ${otherUser.lastName || ""}!\n\n` +
      `They like your book and you like their book:\n` +
      `📚 ${book.title} by ${book.author}\n\n` +
      `You can now contact ${contactInfo} directly through Telegram to arrange your book exchange.`;

    // Send the message with the main keyboard
    const sentMessage = await bot.api.sendMessage(userId, message, {
      reply_markup: getMainKeyboard()
    });
    
    global.app.logger.info(`Match notification sent to user ${userId} - Message ID: ${sentMessage.message_id}`);
    return true;
  } catch (error) {
    global.app.logger.error(`❌ Failed to send match notification to user ${userId}:`, error);
    return false;
  }
}

// Enhanced match creation and notification function
async function createMatchAndNotify(ctx, currentUser, targetUserId) {
  try {
    // Check if match already exists
    const existingMatch = await Match.findOne({
      users: { $all: [currentUser.telegramId, targetUserId] }
    });
    
    if (existingMatch) {
      global.app.logger.debug(`Match already exists between users ${currentUser.telegramId} and ${targetUserId}`);
      return false;
    }
    
    // Get target user's information
    const targetUser = await User.findOne({ telegramId: targetUserId });
    
    if (!targetUser) {
      global.app.logger.error(`Target user ${targetUserId} not found for match creation`);
      return false;
    }
    
    // Create new match
    const match = await Match.create({
      users: [currentUser.telegramId, targetUserId],
      status: "active"
    });
    
    global.app.logger.info(`Match created: ${match._id} between users ${currentUser.telegramId} and ${targetUserId}`);
    
    // Create contact info for the match notification
    const targetContactInfo = targetUser.username 
      ? `@${targetUser.username}` 
      : "this user (they don't have a username)";
    
    // Notify the current user with enhanced message
    await ctx.reply(
      "It's a match! 🎉\n\n" +
      `You and ${targetUser.firstName} ${targetUser.lastName || ""} both liked each other's books!\n\n` +
      `You can contact ${targetContactInfo} directly through Telegram to arrange your book exchange.`
    );
    
    // Notify the other user
    const notified = await notifyUserAboutMatch(ctx.bot, targetUserId, currentUser);
    
    if (notified) {
      global.app.logger.info(`Both users notified about match ${match._id}`);
      return true;
    } else {
      global.app.logger.warn(`Could not notify other user ${targetUserId} about match ${match._id}`);
      return false;
    }
  } catch (error) {
    global.app.logger.error(`Error creating match between ${currentUser.telegramId} and ${targetUserId}:`, error);
    return false;
  }
}

export const handleBrowse = async (ctx) => {
  try {
    const currentUser = await User.findOne({ telegramId: ctx.from.id });
    if (!currentUser) {
      return await ctx.reply("Please use /start to register first!", {
        reply_markup: getMainKeyboard()
      });
    }

    // Check if user has at least one book
    if (!currentUser.books || currentUser.books.length === 0) {
      return await ctx.reply(
        "You need to add at least one book before you can browse! Use the 📕 Add Book button to add your first book.",
        {
          reply_markup: getMainKeyboard()
        }
      );
    }

    const nextBook = await findNextBook(ctx.from.id);
    if (!nextBook) {
      return await ctx.reply("No more books available right now. Check back later! 📚", {
        reply_markup: getMainKeyboard()
      });
    }

    await showBook(ctx, nextBook);
  } catch (error) {
    global.app.logger.error("❌ Browse command error:", error);
    await ctx.reply("Sorry, something went wrong. Please try again later.", {
      reply_markup: getMainKeyboard()
    });
  }
};

// Handle like/skip actions from keyboard
export const handleBrowseAction = async (ctx) => {
  try {
    const action = ctx.message.text.startsWith("👍") ? "like" : "skip";

    // Get the current user being viewed from session
    if (!ctx.session.browsing || !ctx.session.browsing.currentUserId) {
      return await ctx.reply("Session expired. Please start browsing again.", {
        reply_markup: getMainKeyboard()
      });
    }

    // Verify the current user has books
    const currentUser = await User.findOne({ telegramId: ctx.from.id });
    if (!currentUser || !currentUser.books || currentUser.books.length === 0) {
      ctx.session.state = "idle";
      ctx.session.browsing = { currentUserId: null };
      return await ctx.reply(
        "You need to add at least one book before you can like others! Use the 📕 Add Book button to add your first book.",
        {
          reply_markup: getMainKeyboard()
        }
      );
    }

    const targetUserId = ctx.session.browsing.currentUserId;

    global.app.logger.debug(`User ${ctx.from.id} ${action === "like" ? action : action + "pe"}d user ${targetUserId}`);

    // Store the current state before processing to avoid race conditions
    const currentBrowsing = { ...ctx.session.browsing };

    // Immediately acknowledge the action
    let acknowledgeMsg = action === "like" ? "👍 You liked this book!" : "👎 Skipped this book.";
    await ctx.reply(acknowledgeMsg);

    // Reset session browsing state to prevent double processing
    ctx.session.browsing = { currentUserId: null };

    // Process like action
    if (action === "like") {
      // Check if like already exists (prevent duplicates)
      const existingLike = await Like.findOne({
        fromUser: ctx.from.id,
        toUser: targetUserId
      });

      if (!existingLike) {
        // Create new like
        await Like.create({
          fromUser: ctx.from.id,
          toUser: targetUserId,
        });

        global.app.logger.info(`Like created: User ${ctx.from.id} liked user ${targetUserId}`);

        // Check for mutual like
        const mutualLike = await Like.findOne({
          fromUser: targetUserId,
          toUser: ctx.from.id,
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
              // Notify the current user
              await ctx.reply(
                "It's a match! 🎉\n" +
                `You and ${targetUser.firstName} ${targetUser.lastName || ""} both liked each other's books!\n` +
                "Use the Matches button to see all your matches and start a conversation."
              );

              // Notify the other user
              const notified = await notifyUserAboutMatch(ctx.bot, targetUserId, currentUser);

              console.log(targetUserId)
              console.log(currentUser)

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
    }

    // Wait a moment before showing the next book
    setTimeout(async () => {
      try {
        // Show next book
        const nextBook = await findNextBook(ctx.from.id);
        if (nextBook) {
          await showBook(ctx, nextBook);
        } else {
          await ctx.reply(
            "No more books available right now. Check back later! 📚",
            {
              reply_markup: getMainKeyboard()
            }
          );
        }
      } catch (error) {
        global.app.logger.error("❌ Error showing next book:", error);
        await ctx.reply(
          "Sorry, there was an error finding the next book.",
          {
            reply_markup: getMainKeyboard()
          }
        );
      }
    }, 500); // Small delay to ensure messages are received in the right order
  } catch (error) {
    global.app.logger.error("❌ Browse action error:", error);
    ctx.session.state = "idle";
    ctx.session.browsing = { currentUserId: null };
    await ctx.reply("Sorry, something went wrong. Please try again.", {
      reply_markup: getMainKeyboard()
    });
  }
};