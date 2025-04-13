# WebPadel Telegram Bot

This Telegram bot allows users to interact with the WebPadel application directly from Telegram. Users can view events, see who joined, and create new events, with all data syncing to the Firebase backend.

## Features

- View all upcoming padel events
- See detailed information about each event, including who joined
- Create new events with a step-by-step process
- All data syncs with the Firebase backend, so events created in Telegram are visible on the web app and vice versa

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Telegram bot token (get it from [BotFather](https://t.me/botfather))
- Firebase project with Firestore database

### Installation

1. Clone the repository
2. Navigate to the telegram-bot directory:
   ```
   cd telegram-bot
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the telegram-bot directory with the following content:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   FIREBASE_SERVICE_ACCOUNT_PATH=../serviceAccountKey.json
   ```
5. Make sure you have the Firebase service account key file (`serviceAccountKey.json`) in the root directory of the project

### Running the Bot

To start the bot in development mode:
```
npm run dev
```

To start the bot in production mode:
```
npm start
```

## Usage

Once the bot is running, users can interact with it using the following commands:

- `/start` - Start the bot and get a welcome message
- `/help` - Show available commands
- `/events` - List all upcoming events
- `/create` - Start the process of creating a new event

## Event Creation Process

When a user starts the event creation process with the `/create` command, the bot will guide them through the following steps:

1. Enter the event title
2. Enter the event date (YYYY-MM-DD format)
3. Enter the event time (HH:MM format)
4. Enter the event location
5. Enter the price per person (in euros)
6. Enter the maximum number of players (2-8)
7. Enter a description (optional)
8. Confirm the event details

## Firebase Integration

The bot uses Firebase Admin SDK to interact with the Firestore database. Events created through the bot are stored in the same collection as events created through the web application, ensuring data consistency across platforms.

## Troubleshooting

If you encounter any issues:

1. Make sure your Telegram bot token is correct
2. Verify that your Firebase service account key is valid and has the necessary permissions
3. Check the console logs for any error messages
4. Ensure that your Firebase project has Firestore database enabled 