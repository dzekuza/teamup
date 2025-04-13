/**
 * Handle the /start command
 * @param {TelegramBot} bot - The Telegram bot instance
 * @param {Object} msg - The message object from Telegram
 */
function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name;
  
  const welcomeMessage = `Hello ${userName}! 👋\n\n` +
    `Welcome to the WebPadel Telegram Bot. This bot allows you to:\n\n` +
    `• View all padel events\n` +
    `• See who joined each event\n` +
    `• Create new events\n\n` +
    `Use /help to see all available commands.`;
  
  bot.sendMessage(chatId, welcomeMessage);
}

/**
 * Handle the /help command
 * @param {TelegramBot} bot - The Telegram bot instance
 * @param {Object} msg - The message object from Telegram
 */
function handleHelp(bot, msg) {
  const chatId = msg.chat.id;
  
  const helpMessage = `📋 *Available Commands:*\n\n` +
    `/start - Start the bot\n` +
    `/help - Show this help message\n` +
    `/events - List all upcoming events\n` +
    `/create - Create a new event\n\n` +
    `To view details of a specific event, click on the event in the list.`;
  
  bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
}

module.exports = { handleStart, handleHelp }; 