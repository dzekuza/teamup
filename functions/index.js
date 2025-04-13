/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const MailerLite = require('@mailerlite/mailerlite-nodejs').default;

admin.initializeApp();

// Initialize MailerLite client
const mailerlite = new MailerLite({
  api_key: functions.config().mailerlite.api_key,
});

// Email templates
const emailTemplates = {
  playerJoined: (event, player) => ({
    subject: `You've joined: ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #333; margin-bottom: 20px;">You've successfully joined the event!</h2>
        <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #2c5282; margin-top: 0;">${event.title}</h3>
          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${event.time}</p>
            <p style="margin: 10px 0;"><strong>Location:</strong> ${event.location}</p>
            <p style="margin: 10px 0;"><strong>Level:</strong> ${event.level}</p>
            <p style="margin: 10px 0;"><strong>Players:</strong> ${event.players.length}/${event.maxPlayers}</p>
            <p style="margin: 10px 0;"><strong>Price:</strong> €${event.price}</p>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">See you on the court! 🎾</p>
          </div>
        </div>
      </div>
    `
  }),
  creatorNewPlayer: (event, player) => ({
    subject: `New player joined: ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #333; margin-bottom: 20px;">New Player Joined Your Event!</h2>
        <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #2c5282; margin-top: 0;">${event.title}</h3>
          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>New Player:</strong> ${player.name || player.email}</p>
            <p style="margin: 10px 0;"><strong>Current Players:</strong> ${event.players.length}/${event.maxPlayers}</p>
            <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${event.time}</p>
            <p style="margin: 10px 0;"><strong>Location:</strong> ${event.location}</p>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">Your event is filling up! 🎾</p>
          </div>
        </div>
      </div>
    `
  }),
  playerLeft: (event, player) => ({
    subject: `You've left: ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #333; margin-bottom: 20px;">You've left the event</h2>
        <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #2c5282; margin-top: 0;">${event.title}</h3>
          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${event.time}</p>
            <p style="margin: 10px 0;"><strong>Location:</strong> ${event.location}</p>
            <p style="margin: 10px 0;"><strong>Level:</strong> ${event.level}</p>
            <p style="margin: 10px 0;"><strong>Players:</strong> ${event.players.length}/${event.maxPlayers}</p>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">We hope to see you at another event soon! 🎾</p>
          </div>
        </div>
      </div>
    `
  }),
  creatorPlayerLeft: (event, player) => ({
    subject: `Player left: ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <h2 style="color: #333; margin-bottom: 20px;">Player Left Your Event</h2>
        <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="color: #2c5282; margin-top: 0;">${event.title}</h3>
          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Player:</strong> ${player.name || player.email}</p>
            <p style="margin: 10px 0;"><strong>Current Players:</strong> ${event.players.length}/${event.maxPlayers}</p>
            <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${event.time}</p>
            <p style="margin: 10px 0;"><strong>Location:</strong> ${event.location}</p>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">The event is still on! 🎾</p>
          </div>
        </div>
      </div>
    `
  })
};

// Helper function to send emails
async function sendEmail(to, template) {
  try {
    await mailerlite.emails.send({
      from: {
        email: functions.config().mailerlite.from_email,
        name: 'WebPadel'
      },
      to: [{
        email: to
      }],
      subject: template.subject,
      html: template.html
    });
    logger.info('Email sent successfully', { to, subject: template.subject });
  } catch (error) {
    logger.error('Error sending email', { error, to, subject: template.subject });
  }
}

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.onEventUpdate = functions.firestore
  .document('events/{eventId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const previousData = change.before.data();
    
    // Check if players list has changed
    if (JSON.stringify(newData.players) === JSON.stringify(previousData.players)) {
      return null;
    }

    // Find new players (joined)
    const newPlayers = newData.players.filter(
      playerId => !previousData.players.includes(playerId)
    );

    // Find removed players (left)
    const removedPlayers = previousData.players.filter(
      playerId => !newData.players.includes(playerId)
    );

    const eventCreatorDoc = await admin.firestore()
      .collection('users')
      .doc(newData.createdBy)
      .get();
    
    const eventCreator = eventCreatorDoc.data();

    // Send notifications for new players
    for (const playerId of newPlayers) {
      const playerDoc = await admin.firestore()
        .collection('users')
        .doc(playerId)
        .get();
      
      const player = playerDoc.data();
      
      if (player && player.email) {
        // Email to player
        await sendEmail(player.email, emailTemplates.playerJoined(newData, player));

        // Email to event creator
        if (eventCreator && eventCreator.email) {
          await sendEmail(eventCreator.email, emailTemplates.creatorNewPlayer(newData, player));
        }
      }
    }

    // Send notifications for removed players
    for (const playerId of removedPlayers) {
      const playerDoc = await admin.firestore()
        .collection('users')
        .doc(playerId)
        .get();
      
      const player = playerDoc.data();
      
      if (player && player.email) {
        // Email to player
        await sendEmail(player.email, emailTemplates.playerLeft(newData, player));

        // Email to event creator
        if (eventCreator && eventCreator.email) {
          await sendEmail(eventCreator.email, emailTemplates.creatorPlayerLeft(newData, player));
        }
      }
    }
  });
