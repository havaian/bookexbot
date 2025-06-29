// src/utils/validation.js
import { t } from "./localization.js";

// Book condition validation
export const BOOK_CONDITIONS = ["new", "good", "fair", "poor"];

// Validate book info with language support
export const validateBook = (book) => {
  if (!book.title || typeof book.title !== "string") return false;
  if (!book.author || typeof book.author !== "string") return false;
  if (book.condition && !BOOK_CONDITIONS.includes(book.condition)) return false;
  return true;
};

// Validate condition input value against allowed values
export const validateCondition = (condition) => {
  if (!condition) return false;
  return BOOK_CONDITIONS.includes(condition.toLowerCase());
};

// Get map of condition input values to standardized values for each language
export const getConditionInputMap = (langCode) => {
  return {
    [t("condition_new", langCode).toLowerCase()]: "new",
    [t("condition_good", langCode).toLowerCase()]: "good",
    [t("condition_fair", langCode).toLowerCase()]: "fair",
    [t("condition_poor", langCode).toLowerCase()]: "poor",
  };
};

// Translate condition input to standardized form based on language
export const normalizeCondition = (input, langCode) => {
  const messageText = input.toLowerCase();
  
  // Check for emoji condition buttons and map to standard values
  if (messageText.includes(t("condition_new", langCode).toLowerCase())) {
    return 'new';
  } else if (messageText.includes(t("condition_good", langCode).toLowerCase())) {
    return 'good';
  } else if (messageText.includes(t("condition_fair", langCode).toLowerCase())) {
    return 'fair';
  } else if (messageText.includes(t("condition_poor", langCode).toLowerCase())) {
    return 'poor';
  }
  
  // If we get here, use the old map function as fallback
  const conditionMap = getConditionInputMap(langCode);
  return conditionMap[messageText] || messageText;
};

// Validate yes/no input value
export const validateYesNo = (input, langCode) => {
  const yesPattern = t("yes", langCode).toLowerCase();
  const noPattern = t("no", langCode).toLowerCase();
  
  if (input.toLowerCase() === yesPattern || 
      input.toLowerCase() === noPattern || 
      input.toLowerCase() === "yes" || 
      input.toLowerCase() === "no") {
    return true;
  }
  
  return false;
};

// Normalize yes/no input to standardized form
export const normalizeYesNo = (input, langCode) => {
  const yesPattern = t("yes", langCode).toLowerCase();
  
  if (input.toLowerCase() === yesPattern || input.toLowerCase() === "yes") {
    return "yes";
  }
  
  return "no";
};