require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { initializeFirebase } = require('./firebase');
const { handleStart, handleHelp } = require('./handlers/commandHandlers');
const { handleListEvents, handleEventDetails } = require('./handlers/eventHandlers');
const { handleCreateEvent, handleEventCreation, handleEventConfirmation } = require('./handlers/createEventHandlers');
const { handleRequestVerification, handlePhoneNumberVerification, isUserVerified } = require('./handlers/userVerificationHandlers');

// Initialize Firebase
const db = initializeFirebase();

// Bot configuration
const options = {
  polling: {
    interval: 300,
    autoStart: false,  // Don't start polling automatically
    params: {
      timeout: 10
    }
  }
};

// Create a bot instance
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, options);

// Clean up function to handle bot shutdown
async function cleanup() {
  try {
    console.log('Stopping bot polling...');
    await bot.stopPolling();
    console.log('Bot polling stopped');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Handle polling errors
bot.on('polling_error', (error) => {
  // Only log critical errors, not the common 409 conflict
  if (error.code !== 'ETELEGRAM' || !error.message.includes('409')) {
    console.error('Polling error:', error);
  }
});

// Store user states for multi-step processes
const userStates = {};

// Command handlers
bot.onText(/\/start/, (msg) => handleStart(bot, msg));
bot.onText(/\/help/, (msg) => handleHelp(bot, msg));
bot.onText(/\/events/, (msg) => handleListEvents(bot, msg, db));
bot.onText(/\/verify/, (msg) => handleRequestVerification(bot, msg));

// Event creation handlers with verification check
bot.onText(/\/create/, async (msg) => {
  const userId = `Telegram:${msg.from.id}`;
  const isVerified = await isUserVerified(userId, db);
  
  if (!isVerified) {
    handleRequestVerification(bot, msg);
    return;
  }
  
  handleCreateEvent(bot, msg, userStates);
});

// Handle callback queries (for inline keyboards)
bot.on('callback_query', async (callbackQuery) => {
  const data = callbackQuery.data;
  
  // Handle event details
  if (data.startsWith('event_')) {
    const eventId = data.replace('event_', '');
    await handleEventDetails(bot, callbackQuery.message, eventId, db);
  }
  
  // Handle event creation steps
  if (data.startsWith('create_')) {
    const userId = `Telegram:${callbackQuery.from.id}`;
    const isVerified = await isUserVerified(userId, db);
    
    if (!isVerified) {
      bot.answerCallbackQuery(callbackQuery.id, {
        text: 'Please verify your phone number first!',
        show_alert: true
      });
      handleRequestVerification(bot, callbackQuery.message);
      return;
    }
    
    await handleEventConfirmation(bot, callbackQuery, userStates, db);
  }
});

// Handle text messages for event creation
bot.on('message', async (msg) => {
  // Handle phone number verification
  if (msg.contact) {
    await handlePhoneNumberVerification(bot, msg, db);
    return;
  }
  
  // Handle event creation steps
  if (userStates[msg.chat.id] && userStates[msg.chat.id].creatingEvent) {
    const userId = `Telegram:${msg.from.id}`;
    const isVerified = await isUserVerified(userId, db);
    
    if (!isVerified) {
      handleRequestVerification(bot, msg);
      return;
    }
    
    await handleEventCreation(bot, msg, 'input', userStates, db);
  }
});

// Handle graceful shutdown
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start polling
bot.startPolling()
  .then(() => console.log('Telegram bot is running...'))
  .catch(error => {
    console.error('Error starting bot:', error);
    process.exit(1);
  }); 