// src/utils/keyboard.js - Fixed profile menu keyboard
import { Keyboard } from 'grammy';

// Truncate text to specified length
const truncateText = (text, maxLength = 10) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// Main menu keyboard (removed add book button)
export const getMainKeyboard = () => {
  return new Keyboard()
    .text("📚 Browse Books").text("📋 My Profile")
    .row()
    .text("ℹ️ Help")
    .resized();
};

// Profile menu keyboard with Add Book option and null checking
export const getProfileMenuKeyboard = (user) => {
  // Ensure user is defined
  if (!user) {
    // Return a basic keyboard if user is undefined
    return new Keyboard()
      .text("🔙 Back to Main Menu")
      .resized();
  }
  
  const keyboard = new Keyboard();
  
  // First row with status toggle and manage books
  keyboard.text("🔄 Toggle Status").text("📚 Manage Books");
  keyboard.row();
  
  // Add Book option directly in the profile menu
  // Only show if user has fewer than 3 books
  // Check if books array exists before checking its length
  const bookCount = user.books && Array.isArray(user.books) ? user.books.length : 0;
  if (bookCount < 3) {
    keyboard.text("📕 Add Book");
    keyboard.row();
  }
  
  // Back button
  keyboard.text("🔙 Back to Main Menu");
  
  return keyboard.resized();
};

// Book management keyboard with improved layout and null checking
export const getManageBooksKeyboard = (user) => {
  // Ensure user is defined
  if (!user) {
    // Return a basic keyboard if user is undefined
    return new Keyboard()
      .text("🔙 Back to Profile")
      .resized();
  }
  
  const keyboard = new Keyboard();
  
  // Check if books array exists and has books
  if (user.books && Array.isArray(user.books) && user.books.length > 0) {
    // First row can have up to 2 books
    const row1Books = user.books.slice(0, Math.min(2, user.books.length));
    row1Books.forEach((book, index) => {
      const bookName = truncateText(book.title || "Untitled");
      keyboard.text(`❌ Book ${index + 1}: ${bookName}`);
    });
    keyboard.row();
    
    // Second row for the third book (if exists)
    if (user.books.length > 2) {
      const bookName = truncateText(user.books[2].title || "Untitled");
      keyboard.text(`❌ Book 3: ${bookName}`);
      keyboard.row();
    }
  }
  
  // Add 'Add Book' button if user has fewer than 3 books
  const bookCount = user.books && Array.isArray(user.books) ? user.books.length : 0;
  if (bookCount < 3) {
    keyboard.text("📕 Add Book");
    keyboard.row();
  }
  
  // Back button
  keyboard.text("🔙 Back to Profile");
  
  return keyboard.resized();
};

// Confirmation keyboard for book deletion
export const getConfirmDeleteKeyboard = (bookIndex, bookTitle) => {
  const truncatedTitle = truncateText(bookTitle || "Untitled");
  return new Keyboard()
    .text(`✅ Yes, delete "${truncatedTitle}"`)
    .row()
    .text("❌ No, keep it")
    .row()
    .text("🔙 Back to Profile")
    .resized();
};

// Back button only keyboard
export const getBackKeyboard = (text = "🔙 Back to Main Menu") => {
  return new Keyboard()
    .text(text)
    .resized();
};

// Condition selection keyboard
export const getConditionKeyboard = () => {
  return new Keyboard()
    .text("📘 New").text("👍 Good")
    .row()
    .text("👌 Fair").text("😕 Poor")
    .row()
    .text("🔙 Cancel")
    .resized();
};

// Yes/No keyboard
export const getYesNoKeyboard = () => {
  return new Keyboard()
    .text("✅ Yes").text("❌ No")
    .resized();
};

// Browse actions keyboard
export const getBrowseKeyboard = () => {
  return new Keyboard()
    .text("👎 Skip").text("👍 Like")
    .row()
    .text("🔙 Back to Main Menu")
    .resized();
};

// Remove keyboard (go back to text input)
export const removeKeyboard = () => {
  return {
    remove_keyboard: true
  };
};