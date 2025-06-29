// src/middlewares/rateLimit.js
import { cacheService } from "../services/cache.js";
import { formatError } from "../utils/formatters.js";

export const rateLimit = async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId) return next();

  const now = Date.now();
  const userLimit = cacheService.getRateLimit(userId);

  // Reset count after 1 minute
  if (now - userLimit.timestamp > 60000) {
    userLimit.count = 0;
    userLimit.timestamp = now;
  }

  if (userLimit.count >= 30) {
    await ctx.reply(formatError("rateLimit"));
    return;
  }

  userLimit.count++;
  cacheService.setRateLimit(userId, userLimit);

  return next();
};
