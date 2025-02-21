// src/utils/keyboard.js
import { Keyboard } from 'grammy';

// Main menu keyboard
export const getMainKeyboard = () => {
  return new Keyboard()
    .text("📚 Browse Books").text("📋 My Profile")
    .row()
    .text("🔄 My Matches").text("📕 Add Book")
    .row()
    .text("⚙️ Toggle Status").text("ℹ️ Help")
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