// src/utils/localization.js
/**
 * Localization module for the Book Exchange Bot
 * Supports multiple languages with easy extension
 */

// Available languages with their display names
export const AVAILABLE_LANGUAGES = {
  en: "English",
  ru: "Русский",
};

// Default language fallback
export const DEFAULT_LANGUAGE = "en";

// Translation strings for all supported languages
const translations = {
  // English translations
  en: {
    // Main menu
    menu_browse: "📚 Browse Books",
    menu_profile: "📋 My Profile",
    menu_help: "ℹ️ Help",
    menu_language: "🌐 Language",

    // Profile menu
    profile_toggle_status: "🔄 Toggle Status",
    profile_manage_books: "📚 Manage Books",
    profile_add_book: "📕 Add Book",

    // Common buttons
    back_to_main: "🔙 Back to Main Menu",
    back_to_profile: "🔙 Back to Profile",
    cancel: "🔙 Cancel",
    cancel_registration: "🔙 Cancel Registration",

    // Browse actions
    browse_like: "👍 Like",
    browse_skip: "👎 Skip",

    // Book conditions
    condition_new: "📘 New",
    condition_good: "👍 Good",
    condition_fair: "👌 Fair",
    condition_poor: "😕 Poor",

    // Yes/No
    yes: "✅ Yes",
    no: "❌ No",

    // Book management
    delete_book_prefix: "❌ Book ",
    delete_confirm_prefix: "✅ Yes, delete",
    delete_reject: "❌ No, keep it",

    // Status
    status_active_message: "active",
    status_inactive_message: "inactive",

    // Messages
    welcome_message:
      "Welcome to Book Exchange! 📚\n\nPlease select your language:",
    language_selected:
      "Language set to English. You can change it anytime from the main menu.",
    language_selection: "Please select your language:",
    main_menu: "Main Menu",
    registration_start:
      "Let's set up your profile. Please add your first book by sending its title.",
    registration_author: "Great! Now please send me the author's name.",
    registration_condition:
      "Thanks! How would you rate the book's condition?\nChoose one of the options below:",
    registration_cancelled:
      "Registration cancelled. You can start over anytime.",
    registration_add_another:
      "Book added! Would you like to add another book? You can add %d more books.",
    registration_complete:
      "Perfect! Your profile is all set up. 🎉\n\nUse the menu below to navigate:",

    profile_details: "Profile Details:",
    profile_name: "Name: %s",
    profile_status: "Status: %s %s",
    profile_no_books:
      "You don't have any books yet! Add books to start exchanging.",
    profile_books_header: "Your Books:",
    profile_books_remaining: "\n\nYou can add %d more book(s).",
    profile_select_option: "\n\nSelect an option below:",

    book_management: "📚 Book Management",
    book_select_remove: "\n\nSelect a book to remove or add a new book:",
    book_item: "📚 Book %d:\nTitle: %s\nAuthor: %s\nCondition: %s",
    book_deletion_confirm:
      "Are you sure you want to delete this book?\n\nTitle: %s\nAuthor: %s",
    book_deleted: 'Book "%s" has been deleted.',
    book_add_title: "Let's add a new book! Please send me the title.",
    book_add_cancelled: "Adding book cancelled.",
    book_add_success:
      "📚 Book added successfully!\n\nWhat would you like to do next?",
    book_limit_reached:
      "You can only have up to 3 books at a time. Please remove a book first.",

    browse_title:
      "📚 Book Available:\n\nTitle: %s\nAuthor: %s\nCondition: %s\n\nWhat do you think?",
    browse_no_books:
      "You need to add at least one book before you can browse! Use the 📕 Add Book button to add your first book.",
    browse_no_more_books:
      "No more books available right now. Check back later! 📚",
    browse_cancelled: "Browsing cancelled.",
    browse_liked: "👍 You liked this book!",
    browse_skipped: "👎 Skipped this book.",
    browse_session_expired: "Session expired. Please start browsing again.",

    browse_user_header: "Books from %s:",
    browse_question: "What do you think of these books?",
    browse_error: "Sorry, there was an error displaying these books. Use the Browse button to try again.",
    browse_error_next: "Sorry, there was an error finding the next user.",
    match_no_username: "this user (they don't have a username)",

    match_notification:
      "It's a match! 🎉\n\nYou and %s both liked each other's books!\n\nYou can contact %s directly through Telegram to arrange your book exchange.",
    match_notification_other:
      "🎉 Book Match! 🎉\n\nYou've matched with %s!\n\nThey like your book and you like their book:\n📚 %s by %s\n\nYou can now contact %s directly through Telegram to arrange your book exchange.",

    help_title: "📚 Book Exchange Bot - Help Guide",
    help_intro:
      "Welcome to Book Exchange! Use the keyboard menu below to navigate:",
    help_menu_items:
      "📚 Browse Books - Discover and like books from other users\n📋 My Profile - Manage your profile, status, and books\nℹ️ Help - Show this help message\n🌐 Language - Change your language",
    help_profile:
      "💡 Profile Management:\n• Toggle your active/inactive status\n• Add new books (up to 3 total)\n• Manage your existing books",
    help_exchange:
      "💡 Book Exchange Process:\n• Add books to your profile\n• Browse books from other users\n• Like books that interest you\n• When you and another user both like each other's books, it's a match!\n• After a match, you'll receive the other user's contact details\n• Contact them directly through Telegram to arrange your exchange",
    help_conclusion: "Happy book exchanging! 📖",

    error_generic: "Sorry, something went wrong. Please try again later.",
    error_not_registered: "Please use /start to register first!",
    error_invalid_input: "Invalid input. Please try again.",
    error_book_not_found: "Book not found. Please try again.",
    error_user_not_found: "User not found. Please use /start to register.",
  },

  // Russian translations
  ru: {
    // Main menu
    menu_browse: "📚 Искать книги",
    menu_profile: "📋 Мой профиль",
    menu_help: "ℹ️ Помощь",
    menu_language: "🌐 Язык",

    // Profile menu
    profile_toggle_status: "🔄 Изменить статус",
    profile_manage_books: "📚 Управление книгами",
    profile_add_book: "📕 Добавить книгу",

    // Common buttons
    back_to_main: "🔙 Вернуться в меню",
    back_to_profile: "🔙 Вернуться в профиль",
    cancel: "🔙 Отмена",
    cancel_registration: "🔙 Отменить регистрацию",

    // Browse actions
    browse_like: "👍 Нравится",
    browse_skip: "👎 Пропустить",

    // Book conditions
    condition_new: "📘 Новая",
    condition_good: "👍 Хорошая",
    condition_fair: "👌 Средняя",
    condition_poor: "😕 Плохая",

    // Yes/No
    yes: "✅ Да",
    no: "❌ Нет",

    // Book management
    delete_book_prefix: "❌ Книга ",
    delete_confirm_prefix: "✅ Да, удалить",
    delete_reject: "❌ Нет, оставить",

    // Status
    status_active_message: "активен",
    status_inactive_message: "неактивен",

    // Messages
    welcome_message:
      "Добро пожаловать в Book Exchange! 📚\n\nПожалуйста, выберите язык:",
    language_selected:
      "Язык установлен на русский. Вы можете изменить его в любое время из главного меню.",
    language_selection: "Пожалуйста, выберите язык:",
    main_menu: "Главное меню",
    registration_start:
      "Давайте настроим ваш профиль. Добавьте свою первую книгу, отправив ее название.",
    registration_author: "Отлично! Теперь, пожалуйста, отправьте имя автора.",
    registration_condition:
      "Спасибо! Как бы вы оценили состояние книги?\nВыберите один из вариантов ниже:",
    registration_cancelled:
      "Регистрация отменена. Вы можете начать заново в любое время.",
    registration_add_another:
      "Книга добавлена! Хотите добавить еще одну книгу? Вы можете добавить еще %d книг(и).",
    registration_complete:
      "Отлично! Ваш профиль настроен. 🎉\n\nИспользуйте меню ниже для навигации:",

    profile_details: "Данные профиля:",
    profile_name: "Имя: %s",
    profile_status: "Статус: %s %s",
    profile_no_books: "У вас еще нет книг! Добавьте книги, чтобы начать обмен.",
    profile_books_header: "Ваши книги:",
    profile_books_remaining: "\n\nВы можете добавить еще %d книг(и).",
    profile_select_option: "\n\nВыберите опцию ниже:",

    book_management: "📚 Управление книгами",
    book_select_remove:
      "\n\nВыберите книгу для удаления или добавьте новую книгу:",
    book_item: "📚 Книга %d:\nНазвание: %s\nАвтор: %s\nСостояние: %s",
    book_deletion_confirm:
      "Вы уверены, что хотите удалить эту книгу?\n\nНазвание: %s\nАвтор: %s",
    book_deleted: 'Книга "%s" была удалена.',
    book_add_title:
      "Давайте добавим новую книгу! Пожалуйста, отправьте название.",
    book_add_cancelled: "Добавление книги отменено.",
    book_add_success:
      "📚 Книга успешно добавлена!\n\nЧто бы вы хотели сделать дальше?",
    book_limit_reached:
      "Вы можете иметь не более 3 книг одновременно. Пожалуйста, удалите книгу.",

    browse_title:
      "📚 Доступная книга:\n\nНазвание: %s\nАвтор: %s\nСостояние: %s\n\nЧто вы думаете?",
    browse_no_books:
      "Вам нужно добавить хотя бы одну книгу, прежде чем вы сможете просматривать! Используйте кнопку 📕 Добавить книгу.",
    browse_no_more_books: "Сейчас нет доступных книг. Проверьте позже! 📚",
    browse_cancelled: "Просмотр отменен.",
    browse_liked: "👍 Вам понравилась эта книга!",
    browse_skipped: "👎 Книга пропущена.",
    browse_session_expired:
      "Сессия истекла. Пожалуйста, начните просмотр снова.",

    browse_user_header: "Книги от %s:",
    browse_question: "Что вы думаете об этих книгах?",
    browse_error: "Извините, произошла ошибка при отображении этих книг. Используйте кнопку Искать книги, чтобы попробовать снова.",
    browse_error_next: "Извините, произошла ошибка при поиске следующего пользователя.",
    match_no_username: "этот пользователь (у него нет имени пользователя)",

    match_notification:
      "Совпадение! 🎉\n\nВы и %s оба понравились книги друг друга!\n\nВы можете связаться с %s напрямую через Telegram, чтобы договориться об обмене книгами.",
    match_notification_other:
      "🎉 Совпадение по книге! 🎉\n\nУ вас совпадение с %s!\n\nИм нравится ваша книга, а вам нравится их книга:\n📚 %s от %s\n\nТеперь вы можете связаться с %s напрямую через Telegram, чтобы договориться об обмене книгами.",

    help_title: "📚 Book Exchange Bot - Руководство",
    help_intro:
      "Добро пожаловать в Book Exchange! Используйте меню клавиатуры ниже для навигации:",
    help_menu_items:
      "📚 Искать книги - Находите и отмечайте понравившиеся книги\n📋 Мой профиль - Управляйте профилем, статусом и книгами\nℹ️ Помощь - Показать это сообщение\n🌐 Язык - Изменить язык",
    help_profile:
      "💡 Управление профилем:\n• Переключайте статус активен/неактивен\n• Добавляйте новые книги (до 3 всего)\n• Управляйте существующими книгами",
    help_exchange:
      "💡 Процесс обмена книгами:\n• Добавьте книги в свой профиль\n• Просматривайте книги других пользователей\n• Отмечайте понравившиеся книги\n• Когда вы и другой пользователь оба отметили книги друг друга, это совпадение!\n• После совпадения вы получите контактные данные другого пользователя\n• Свяжитесь с ними напрямую через Telegram, чтобы договориться об обмене",
    help_conclusion: "Приятного обмена книгами! 📖",

    error_generic:
      "Извините, что-то пошло не так. Пожалуйста, попробуйте позже.",
    error_not_registered: "Пожалуйста, используйте /start для регистрации!",
    error_invalid_input: "Неверный ввод. Пожалуйста, попробуйте снова.",
    error_book_not_found: "Книга не найдена. Пожалуйста, попробуйте снова.",
    error_user_not_found:
      "Пользователь не найден. Пожалуйста, используйте /start для регистрации.",
  },
};

/**
 * Get a translation string based on the language code
 * @param {string} key - The translation key
 * @param {string} langCode - The language code (defaults to English)
 * @param {...any} args - Format arguments for the translation string
 * @returns {string} - The translated string
 */
export function t(key, langCode = DEFAULT_LANGUAGE, ...args) {
  // Fall back to default language if the requested one isn't available
  if (!translations[langCode]) {
    langCode = DEFAULT_LANGUAGE;
  }

  // Get the translation string
  const translationString =
    translations[langCode][key] || translations[DEFAULT_LANGUAGE][key] || key;

  // If there are format arguments, apply them
  if (args.length > 0) {
    return translationString.replace(/%[sdfo]/g, (match) => {
      const arg = args.shift();
      if (arg === undefined) return match;
      return String(arg);
    });
  }

  return translationString;
}

/**
 * Format a condition string with the appropriate emoji
 * @param {string} condition - The condition value
 * @param {string} langCode - The language code
 * @returns {string} - Formatted condition string
 */
export function formatCondition(condition, langCode = DEFAULT_LANGUAGE) {
  if (!condition) return t("condition_unknown", langCode);

  const conditionKey = `condition_${condition.toLowerCase()}`;
  return translations[langCode][conditionKey] || condition;
}
