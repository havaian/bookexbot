// src/utils/keyboard.js
import { Keyboard } from 'grammy';
import { t, AVAILABLE_LANGUAGES } from './localization.js';

// Truncate text to specified length
const truncateText = (text, maxLength = 10) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Main menu keyboard with language button
export const getMainKeyboard = (langCode) => {
  return new Keyboard()
    .text(t("menu_browse", langCode)).text(t("menu_profile", langCode))
    .row()
    .text(t("menu_help", langCode)).text(t("menu_language", langCode))
    .resized();
};

// Language selection keyboard
export const getLanguageKeyboard = () => {
  const keyboard = new Keyboard();
  
  // Add a button for each available language
  Object.entries(AVAILABLE_LANGUAGES).forEach(([code, name], index) => {
    keyboard.text(name);
    // Add a new row after every 2 languages
    if (index % 2 !== 0) {
      keyboard.row();
    }
  });
  
  // Ensure we have a row before adding the back button
  if (Object.keys(AVAILABLE_LANGUAGES).length % 2 !== 0) {
    keyboard.row();
  }
  
  // Add back button
  keyboard.text("🔙 Back / Назад");
  
  return keyboard.resized();
};

// Profile menu keyboard with Add Book option and null checking
export const getProfileMenuKeyboard = (user, langCode) => {
  // Ensure user is defined
  if (!user) {
    // Return a basic keyboard if user is undefined
    return new Keyboard()
      .text(t("back_to_main", langCode))
      .resized();
  }
  
  const keyboard = new Keyboard();
  
  // First row with status toggle and manage books
  keyboard.text(t("profile_toggle_status", langCode)).text(t("profile_manage_books", langCode));
  keyboard.row();
  
  // Add Book option directly in the profile menu
  // Only show if user has fewer than 3 books
  // Check if books array exists before checking its length
  const bookCount = user.books && Array.isArray(user.books) ? user.books.length : 0;
  if (bookCount < 3) {
    keyboard.text(t("profile_add_book", langCode));
    keyboard.row();
  }
  
  // Back button
  keyboard.text(t("back_to_main", langCode));
  
  return keyboard.resized();
};

// Book management keyboard with improved layout and null checking
export const getManageBooksKeyboard = (user, langCode) => {
  // Ensure user is defined
  if (!user) {
    // Return a basic keyboard if user is undefined
    return new Keyboard()
      .text(t("back_to_profile", langCode))
      .resized();
  }
  
  const keyboard = new Keyboard();
  
  // Check if books array exists and has books
  if (user.books && Array.isArray(user.books) && user.books.length > 0) {
    // First row can have up to 2 books
    const row1Books = user.books.slice(0, Math.min(2, user.books.length));
    row1Books.forEach((book, index) => {
      const bookName = truncateText(book.title || "Untitled");
      keyboard.text(`${t("delete_book_prefix", langCode)}${index + 1}: ${bookName}`);
    });
    keyboard.row();
    
    // Second row for the third book (if exists)
    if (user.books.length > 2) {
      const bookName = truncateText(user.books[2].title || "Untitled");
      keyboard.text(`${t("delete_book_prefix", langCode)}3: ${bookName}`);
      keyboard.row();
    }
  }
  
  // Add 'Add Book' button if user has fewer than 3 books
  const bookCount = user.books && Array.isArray(user.books) ? user.books.length : 0;
  if (bookCount < 3) {
    keyboard.text(t("profile_add_book", langCode));
    keyboard.row();
  }
  
  // Back button
  keyboard.text(t("back_to_profile", langCode));
  
  return keyboard.resized();
};

// Confirmation keyboard for book deletion
export const getConfirmDeleteKeyboard = (bookIndex, bookTitle, langCode) => {
  const truncatedTitle = truncateText(bookTitle || "Untitled");
  return new Keyboard()
    .text(`${t("delete_confirm_prefix", langCode)} "${truncatedTitle}"`)
    .row()
    .text(t("delete_reject", langCode))
    .row()
    .text(t("back_to_profile", langCode))
    .resized();
};

// Back button only keyboard
export const getBackKeyboard = (text, langCode) => {
  return new Keyboard()
    .text(text || t("back_to_main", langCode))
    .resized();
};

// Condition selection keyboard
export const getConditionKeyboard = (langCode) => {
  return new Keyboard()
    .text(t("condition_new", langCode)).text(t("condition_good", langCode))
    .row()
    .text(t("condition_fair", langCode)).text(t("condition_poor", langCode))
    .row()
    .text(t("cancel", langCode))
    .resized();
};

// Yes/No keyboard
export const getYesNoKeyboard = (langCode) => {
  return new Keyboard()
    .text(t("yes", langCode)).text(t("no", langCode))
    .resized();
};

// Browse actions keyboard
export const getBrowseKeyboard = (langCode) => {
  return new Keyboard()
    .text(t("browse_skip", langCode)).text(t("browse_like", langCode))
    .row()
    .text(t("back_to_main", langCode))
    .resized();
};

// Remove keyboard (go back to text input)
export const removeKeyboard = () => {
  return {
    remove_keyboard: true
  };
};