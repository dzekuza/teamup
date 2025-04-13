/**
 * Handle user verification with phone number
 * @param {TelegramBot} bot - The Telegram bot instance
 * @param {Object} msg - The message object from Telegram
 */
function handleRequestVerification(bot, msg) {
  const chatId = msg.chat.id;
  
  const keyboard = {
    keyboard: [[{
      text: '📱 Share Phone Number',
      request_contact: true
    }]],
    resize_keyboard: true,
    one_time_keyboard: true
  };
  
  bot.sendMessage(
    chatId,
    'To create or join events, please verify your phone number by clicking the button below:',
    { reply_markup: keyboard }
  );
}

/**
 * Handle phone number verification
 * @param {TelegramBot} bot - The Telegram bot instance
 * @param {Object} msg - The message object from Telegram
 * @param {Firestore} db - The Firestore database instance
 */
async function handlePhoneNumberVerification(bot, msg, db) {
  const chatId = msg.chat.id;
  const userId = `Telegram:${msg.from.id}`;
  
  try {
    console.log('Received verification request:', {
      userId,
      fromId: msg.from.id,
      contact: msg.contact ? {
        userId: msg.contact.user_id,
        phoneNumber: msg.contact.phone_number
      } : null
    });

    // Check if we received a contact
    if (!msg.contact) {
      console.log('No contact received');
      bot.sendMessage(
        chatId,
        '❌ Please use the "Share Phone Number" button to verify your phone number.',
        { reply_markup: { remove_keyboard: true } }
      );
      return;
    }

    // Verify that the contact is from the same user
    if (msg.contact.user_id && msg.contact.user_id.toString() !== msg.from.id.toString()) {
      console.log('User ID mismatch:', {
        contactUserId: msg.contact.user_id,
        fromId: msg.from.id
      });
      bot.sendMessage(
        chatId,
        '❌ You can only verify your own phone number.',
        { reply_markup: { remove_keyboard: true } }
      );
      return;
    }

    // Save the verified user to Firestore
    const userData = {
      phoneNumber: msg.contact.phone_number,
      firstName: msg.from.first_name,
      lastName: msg.from.last_name || '',
      username: msg.from.username || '',
      verifiedAt: new Date().toISOString(),
      telegramId: msg.from.id.toString()
    };

    console.log('Saving user data:', { userId, userData });
    
    await db.collection('verifiedUsers').doc(userId).set(userData);
    console.log('User data saved successfully');
    
    bot.sendMessage(
      chatId,
      '✅ Phone number verified successfully! You can now create and join events.',
      { reply_markup: { remove_keyboard: true } }
    );
  } catch (error) {
    console.error('Error verifying phone number:', error);
    bot.sendMessage(
      chatId,
      '❌ Error verifying phone number. Please try again later.',
      { reply_markup: { remove_keyboard: true } }
    );
  }
}

/**
 * Check if a user is verified
 * @param {string} userId - The user ID to check
 * @param {Firestore} db - The Firestore database instance
 * @returns {Promise<boolean>} Whether the user is verified
 */
async function isUserVerified(userId, db) {
  try {
    const userDoc = await db.collection('verifiedUsers').doc(userId).get();
    return userDoc.exists;
  } catch (error) {
    console.error('Error checking user verification:', error);
    return false;
  }
}

module.exports = {
  handleRequestVerification,
  handlePhoneNumberVerification,
  isUserVerified
}; 