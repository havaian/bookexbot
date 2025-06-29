// src/services/cache.js
import NodeCache from "node-cache";

class CacheService {
  constructor() {
    // TTL defaults: 30 minutes for sessions, 1 hour for browse history
    this.cache = new NodeCache({
      stdTTL: 1800,
      checkperiod: 600,
    });

    this.keys = {
      SESSION: "session_",
      BROWSE: "browse_",
      RATE_LIMIT: "rate_",
    };
  }

  // Session management
  getSession(userId) {
    const key = `${this.keys.SESSION}${userId}`;
    return (
      this.cache.get(key) || {
        state: "idle",
        step: 0,
        tempData: {},
      }
    );
  }

  setSession(userId, data, ttl = 1800) {
    const key = `${this.keys.SESSION}${userId}`;
    return this.cache.set(key, data, ttl);
  }

  clearSession(userId) {
    const key = `${this.keys.SESSION}${userId}`;
    return this.cache.del(key);
  }

  // Browse history management
  getBrowseHistory(userId) {
    const key = `${this.keys.BROWSE}${userId}`;
    return this.cache.get(key) || [];
  }

  addToBrowseHistory(userId, viewedUserId) {
    const key = `${this.keys.BROWSE}${userId}`;
    const history = this.getBrowseHistory(userId);
    history.push(viewedUserId);
    return this.cache.set(key, history, 3600); // 1 hour TTL
  }

  clearBrowseHistory(userId) {
    const key = `${this.keys.BROWSE}${userId}`;
    return this.cache.del(key);
  }

  // Rate limiting
  getRateLimit(userId) {
    const key = `${this.keys.RATE_LIMIT}${userId}`;
    return this.cache.get(key) || { count: 0, timestamp: Date.now() };
  }

  setRateLimit(userId, data) {
    const key = `${this.keys.RATE_LIMIT}${userId}`;
    return this.cache.set(key, data, 60); // 1 minute TTL
  }

  // General cache methods
  set(key, value, ttl = 1800) {
    return this.cache.set(key, value, ttl);
  }

  get(key) {
    return this.cache.get(key);
  }

  del(key) {
    return this.cache.del(key);
  }

  flush() {
    return this.cache.flushAll();
  }

  // Stats and monitoring
  getStats() {
    try {
      if (this.cache && typeof this.cache.getStats === 'function') {
        return this.cache.getStats();
      } else {
        // Return a simplified stats object if the method is not available
        return {
          keys: Object.keys(this.cache.data || {}).length || 0,
          hits: 0,
          misses: 0,
          ksize: 0,
          vsize: 0,
        };
      }
    } catch (error) {
      // Return empty stats on error to prevent crashes
      return { error: 'Failed to get cache stats', keys: 0 };
    }
  }
}

// Export a singleton instance
export const cacheService = new CacheService();
