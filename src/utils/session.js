// src/services/session.js
import { cacheService } from "../services/cache.js";
import { STATES } from "./constants.js";

export const sessionService = {
  // Initialize user session
  initSession: (userId) => {
    return cacheService.setSession(userId, {
      state: STATES.REGISTRATION,
      step: 0,
      tempData: {},
    });
  },

  // Get current user session
  getSession: (userId) => {
    return cacheService.getSession(userId);
  },

  // Update session state
  updateState: (userId, state) => {
    const session = cacheService.getSession(userId);
    session.state = state;
    return cacheService.setSession(userId, session);
  },

  // Update session step
  updateStep: (userId, step) => {
    const session = cacheService.getSession(userId);
    session.step = step;
    return cacheService.setSession(userId, session);
  },

  // Store temporary data
  setTempData: (userId, data) => {
    const session = cacheService.getSession(userId);
    session.tempData = { ...session.tempData, ...data };
    return cacheService.setSession(userId, session);
  },

  // Clear session
  clearSession: (userId) => {
    return cacheService.clearSession(userId);
  },
};
