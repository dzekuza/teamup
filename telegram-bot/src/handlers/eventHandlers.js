/**
 * Handle listing all events
 * @param {TelegramBot} bot - The Telegram bot instance
 * @param {Object} msg - The message object from Telegram
 * @param {Firestore} db - The Firestore database instance
 */
async function handleListEvents(bot, msg, db) {
  const chatId = msg.chat.id;
  
  try {
    // Send a loading message
    const loadingMsg = await bot.sendMessage(chatId, 'Loading events...');
    
    // Get all events from Firestore
    const eventsSnapshot = await db.collection('events').orderBy('date', 'asc').get();
    
    if (eventsSnapshot.empty) {
      await bot.editMessageText('No events found.', {
        chat_id: chatId,
        message_id: loadingMsg.message_id
      });
      return;
    }
    
    // Create inline keyboard with event buttons
    const events = [];
    const keyboard = {
      inline_keyboard: []
    };
    
    eventsSnapshot.forEach(doc => {
      const event = doc.data();
      event.id = doc.id;
      events.push(event);
      
      // Format date for display
      const eventDate = new Date(event.date);
      const formattedDate = eventDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
      
      // Add button for each event
      keyboard.inline_keyboard.push([
        { 
          text: `${formattedDate} - ${event.title}`, 
          callback_data: `event_${doc.id}` 
        }
      ]);
    });
    
    // Send the list of events with inline keyboard
    await bot.editMessageText('📅 *Upcoming Events:*\n\nClick on an event to see details.', {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    bot.sendMessage(chatId, 'Sorry, there was an error fetching events. Please try again later.');
  }
}

/**
 * Handle showing event details
 * @param {TelegramBot} bot - The Telegram bot instance
 * @param {Object} msg - The message object from Telegram
 * @param {string} eventId - The ID of the event to show
 * @param {Firestore} db - The Firestore database instance
 */
async function handleEventDetails(bot, msg, eventId, db) {
  const chatId = msg.chat.id;
  
  try {
    // Get the event from Firestore
    const eventDoc = await db.collection('events').doc(eventId).get();
    
    if (!eventDoc.exists) {
      bot.answerCallbackQuery(msg.id, { text: 'Event not found.' });
      return;
    }
    
    const event = eventDoc.data();
    
    // Format date and time
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Create event details message
    let detailsMessage = `🎾 *${event.title}*\n\n`;
    detailsMessage += `📅 *Date:* ${formattedDate}\n`;
    detailsMessage += `⏰ *Time:* ${event.time}\n`;
    detailsMessage += `📍 *Location:* ${event.location}\n`;
    detailsMessage += `💰 *Price:* €${event.price}\n`;
    detailsMessage += `👥 *Players:* ${event.currentPlayers}/${event.maxPlayers}\n\n`;
    
    // Add players list if there are any
    if (event.players && event.players.length > 0) {
      detailsMessage += `*Players who joined:*\n`;
      event.players.forEach((player, index) => {
        detailsMessage += `${index + 1}. ${player}\n`;
      });
    } else {
      detailsMessage += `*No players have joined yet.*\n`;
    }
    
    // Add description if available
    if (event.description) {
      detailsMessage += `\n*Description:*\n${event.description}`;
    }
    
    // Send the event details
    await bot.editMessageText(detailsMessage, {
      chat_id: chatId,
      message_id: msg.message_id,
      parse_mode: 'Markdown'
    });
    
    // Answer the callback query
    bot.answerCallbackQuery(msg.id);
  } catch (error) {
    console.error('Error fetching event details:', error);
    bot.answerCallbackQuery(msg.id, { text: 'Error fetching event details.' });
  }
}

module.exports = { handleListEvents, handleEventDetails }; 