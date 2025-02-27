// src/utils/formatters.js
import { t, formatCondition as formatConditionLocalized } from "./localization.js";

// Format a single book's details with language support
export const formatBook = (book, index = null, langCode) => {
  const header = index !== null 
    ? t("book_item", langCode, index + 1, book.title, book.author, formatConditionLocalized(book.condition, langCode))
    : t("book_item", langCode, 1, book.title, book.author, formatConditionLocalized(book.condition, langCode));
  
  return header;
};

// Format user profile with language support
export const formatProfile = (user, langCode) => {
  const statusEmoji = user.status === "active" ? "🟢" : "🔴";
  let message = `${t("profile_details", langCode)}\n`;
  
  message += t("profile_name", langCode, `${user.firstName} ${user.lastName || ""}`);
  message += `\n${t("profile_status", langCode, statusEmoji, t(`status_${user.status}_message`, langCode))}\n\n`;
  
  // Check if user has books
  if (!user.books || user.books.length === 0) {
    message += t("profile_no_books", langCode);
  } else {
    // Format book list
    const bookList = user.books
      .map((book, index) => {
        return formatBook(book, index, langCode);
      })
      .join("\n\n");
    
    message += `${t("profile_books_header", langCode)}\n${bookList}`;
    
    // Add note about book limit
    if (user.books.length < 3) {
      message += t("profile_books_remaining", langCode, 3 - user.books.length);
    }
  }
  
  message += t("profile_select_option", langCode);
  
  return message;
};

// Format match details with language support
export const formatMatch = (match, otherUser, index = null, langCode) => {
  const header = index !== null ? `Match #${index + 1}:` : "Match:";
  const books = otherUser.books
    .map((book) => `- ${book.title} by ${book.author}`)
    .join("\n");

  return [
    header,
    `User: ${otherUser.firstName} ${otherUser.lastName || ""}`,
    `Books:\n${books}`,
    `Contact: @${otherUser.username || "[no username]"}`,
    `------------------`,
  ].join("\n");
};

// Format help message with language support
export const formatHelp = (langCode) => {
  return [
    t("help_title", langCode),
    "",
    t("help_intro", langCode),
    "",
    t("help_menu_items", langCode),
    "",
    t("help_profile", langCode),
    "",
    t("help_exchange", langCode),
    "",
    t("help_conclusion", langCode),
  ].join("\n");
};

// Format error messages with language support
export const formatError = (type, langCode) => {
  const errorKey = `error_${type}`;
  return t(errorKey, langCode);
};