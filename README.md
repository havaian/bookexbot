# Book Exchange Bot

A Telegram bot for exchanging books with other users.

## Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Create .env file:
\`\`\`
BOT_TOKEN=your_telegram_bot_token
MONGODB_URI=your_mongodb_uri
\`\`\`

3. Start MongoDB:
\`\`\`bash
docker-compose up -d
\`\`\`

4. Run the bot:
\`\`\`bash
npm start
\`\`\`

## Commands

- /start - Register and add books
- /profile - View your profile
- /status - Toggle active/inactive
- /browse - Discover books
- /matches - View your matches
- /help - Show available commands

## MVP Features

- User registration with book listing
- Book browsing with like/skip
- Match notifications
- Basic profile management