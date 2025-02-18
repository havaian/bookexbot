// src/utils/formatters.js

// Format a single book's details
export const formatBook = (book, index = null) => {
  const header = index !== null ? `📚 Book ${index + 1}:` : "📚 Book:";
  return [
    header,
    `Title: ${book.title}`,
    `Author: ${book.author}`,
    `Condition: ${formatCondition(book.condition)}`,
  ].join("\n");
};

// Format condition with emoji
export const formatCondition = (condition) => {
  const conditionEmojis = {
    new: "📘 New",
    good: "👍 Good",
    fair: "👌 Fair",
    poor: "😕 Poor",
  };
  return conditionEmojis[condition.toLowerCase()] || condition;
};

// Format user profile
export const formatProfile = (user) => {
  const statusEmoji = user.status === "active" ? "🟢" : "🔴";
  const bookList = user.books
    .map((book, index) => formatBook(book, index))
    .join("\n\n");

  return [
    `Profile Details:`,
    `Name: ${user.firstName} ${user.lastName || ""}`,
    `Status: ${statusEmoji} ${user.status}\n`,
    `Your Books:`,
    bookList,
  ].join("\n");
};

// Format match details
export const formatMatch = (match, otherUser, index = null) => {
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

// Format help message
export const formatHelp = () => {
  return [
    "📚 Book Exchange Bot - Commands:",
    "",
    "/start - Register and add your books",
    "/profile - View your profile and books",
    "/status - Toggle active/inactive status",
    "/browse - Discover books from others",
    "/matches - View your book matches",
    "/help - Show this help message",
    "",
    "💡 Tips:",
    "- Add up to 3 books to your profile",
    "- Stay active to let others see your books",
    "- Like books to create matches",
    "- Contact matches via Telegram to arrange exchanges",
  ].join("\n");
};

// Format error messages
export const formatError = (type) => {
  const errors = {
    generic: "Sorry, something went wrong. Please try again later.",
    notRegistered: "Please use /start to register first!",
    invalidInput: "Invalid input. Please try again.",
    noMatches:
      "You don't have any matches yet. Use /browse to discover more books!",
    noBooks: "No more books available right now. Check back later! 📚",
    rateLimit: "Please wait a moment before sending more requests.",
  };
  return errors[type] || errors.generic;
};
