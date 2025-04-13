/**
 * Handle the /create command to start event creation
 * @param {TelegramBot} bot - The Telegram bot instance
 * @param {Object} msg - The message object from Telegram
 * @param {Object} userStates - Object to store user states
 */
function handleCreateEvent(bot, msg, userStates) {
  const chatId = msg.chat.id;
  
  // Initialize user state for event creation
  userStates[chatId] = {
    creatingEvent: true,
    step: 'title',
    eventData: {}
  };
  
  // Ask for event title
  bot.sendMessage(chatId, 'Let\'s create a new event! 🎾\n\nPlease enter the title of the event:');
}

/**
 * Handle the event creation process step by step
 * @param {TelegramBot} bot - The Telegram bot instance
 * @param {Object} msg - The message object from Telegram
 * @param {string} step - The current step in the event creation process
 * @param {Object} userStates - Object to store user states
 * @param {Firestore} db - The Firestore database instance
 */
async function handleEventCreation(bot, msg, step, userStates, db) {
  const chatId = msg.chat.id;
  const userState = userStates[chatId];
  
  // If user is not in event creation mode, ignore
  if (!userState || !userState.creatingEvent) {
    return;
  }
  
  // Handle different steps of event creation
  switch (userState.step) {
    case 'title':
      // Save title and ask for date
      userState.eventData.title = msg.text;
      userState.step = 'date';
      bot.sendMessage(chatId, 'Great! Now, please enter the date of the event (YYYY-MM-DD):');
      break;
      
    case 'date':
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(msg.text)) {
        bot.sendMessage(chatId, 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2023-12-25):');
        return;
      }
      
      // Save date and ask for time
      userState.eventData.date = msg.text;
      userState.step = 'time';
      bot.sendMessage(chatId, 'Perfect! Now, please enter the time of the event (HH:MM):');
      break;
      
    case 'time':
      // Validate time format
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(msg.text)) {
        bot.sendMessage(chatId, 'Invalid time format. Please use HH:MM format (e.g., 14:30):');
        return;
      }
      
      // Save time and ask for location
      userState.eventData.time = msg.text;
      userState.step = 'location';
      bot.sendMessage(chatId, 'Great! Now, please enter the location of the event:');
      break;
      
    case 'location':
      // Save location and ask for price
      userState.eventData.location = msg.text;
      userState.step = 'price';
      bot.sendMessage(chatId, 'Perfect! Now, please enter the price per person (in euros):');
      break;
      
    case 'price':
      // Validate price
      const price = parseFloat(msg.text);
      if (isNaN(price) || price < 0) {
        bot.sendMessage(chatId, 'Invalid price. Please enter a valid number:');
        return;
      }
      
      // Save price and ask for max players
      userState.eventData.price = price;
      userState.step = 'maxPlayers';
      bot.sendMessage(chatId, 'Great! Now, please enter the maximum number of players:');
      break;
      
    case 'maxPlayers':
      // Validate max players
      const maxPlayers = parseInt(msg.text);
      if (isNaN(maxPlayers) || maxPlayers < 2 || maxPlayers > 8) {
        bot.sendMessage(chatId, 'Invalid number of players. Please enter a number between 2 and 8:');
        return;
      }
      
      // Save max players and ask for description
      userState.eventData.maxPlayers = maxPlayers;
      userState.eventData.currentPlayers = 0;
      userState.eventData.players = [];
      userState.step = 'description';
      bot.sendMessage(chatId, 'Perfect! Finally, please enter a description for the event (or send "skip" to skip this step):');
      break;
      
    case 'description':
      // Save description (if not skipped)
      if (msg.text.toLowerCase() !== 'skip') {
        userState.eventData.description = msg.text;
      }
      
      // Confirm event creation
      const eventData = userState.eventData;
      const confirmMessage = `🎾 *Event Details:*\n\n` +
        `*Title:* ${eventData.title}\n` +
        `*Date:* ${eventData.date}\n` +
        `*Time:* ${eventData.time}\n` +
        `*Location:* ${eventData.location}\n` +
        `*Price:* €${eventData.price}\n` +
        `*Max Players:* ${eventData.maxPlayers}\n` +
        (eventData.description ? `*Description:* ${eventData.description}\n` : '');
      
      const keyboard = {
        inline_keyboard: [
          [
            { text: '✅ Confirm', callback_data: 'create_confirm' },
            { text: '❌ Cancel', callback_data: 'create_cancel' }
          ]
        ]
      };
      
      bot.sendMessage(chatId, confirmMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      
      // Move to confirmation step
      userState.step = 'confirm';
      break;
      
    case 'confirm':
      // This step is handled by the callback query handler
      break;
      
    default:
      // Reset user state if something goes wrong
      delete userStates[chatId];
      bot.sendMessage(chatId, 'Something went wrong. Please try again with /create command.');
  }
}

/**
 * Handle the confirmation of event creation
 * @param {TelegramBot} bot - The Telegram bot instance
 * @param {Object} callbackQuery - The callback query from Telegram
 * @param {Object} userStates - Object to store user states
 * @param {Firestore} db - The Firestore database instance
 */
async function handleEventConfirmation(bot, callbackQuery, userStates, db) {
  const chatId = callbackQuery.message.chat.id;
  const userState = userStates[chatId];
  
  if (!userState || !userState.creatingEvent || userState.step !== 'confirm') {
    return;
  }
  
  const action = callbackQuery.data.replace('create_', '');
  
  if (action === 'cancel') {
    // Cancel event creation
    delete userStates[chatId];
    await bot.editMessageText('Event creation cancelled.', {
      chat_id: chatId,
      message_id: callbackQuery.message.message_id
    });
    bot.answerCallbackQuery(callbackQuery.id, { text: 'Event creation cancelled.' });
    return;
  }
  
  if (action === 'confirm') {
    try {
      // Add creation timestamp and creator info
      const eventData = userState.eventData;
      eventData.createdAt = new Date().toISOString();
      eventData.createdBy = `Telegram:${callbackQuery.from.id}`;
      
      // Save event to Firestore
      const docRef = await db.collection('events').add(eventData);
      
      // Clean up user state
      delete userStates[chatId];
      
      // Send confirmation message
      await bot.editMessageText(`✅ Event created successfully!\n\nYou can view all events with /events command.`, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id
      });
      
      bot.answerCallbackQuery(callbackQuery.id, { text: 'Event created successfully!' });
    } catch (error) {
      console.error('Error creating event:', error);
      await bot.editMessageText('❌ Error creating event. Please try again later.', {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id
      });
      
      bot.answerCallbackQuery(callbackQuery.id, { text: 'Error creating event.' });
    }
  }
}

module.exports = { 
  handleCreateEvent, 
  handleEventCreation,
  handleEventConfirmation
}; 