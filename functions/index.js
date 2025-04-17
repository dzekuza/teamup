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
const { onSchedule } = require("firebase-functions/v2/scheduler");

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
  }),
  
  welcomeEmail: (user) => ({
    subject: `Welcome to WebPadel!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1E1E1E; color: white;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/whitepadel.png?alt=media&token=0b125f07-4d49-44a1-a255-2d77744b29d8" alt="WebPadel" style="height: 40px; width: auto;" />
        </div>
        <h2 style="color: #C1FF2F; margin-bottom: 20px;">Welcome to WebPadel!</h2>
        <div style="background-color: #2A2A2A; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin-bottom: 15px;">Hi ${user.displayName || 'there'},</p>
          <p style="margin-bottom: 15px;">Thanks for joining WebPadel! We're excited to have you as part of our community.</p>
          <p style="margin-bottom: 15px;">With WebPadel, you can:</p>
          <ul style="margin-bottom: 15px; padding-left: 20px;">
            <li>Find padel events near you</li>
            <li>Create your own events</li>
            <li>Connect with other players</li>
            <li>Track your progress</li>
          </ul>
          <p>Ready to get started? Check out upcoming events or create your own!</p>
        </div>
        <div style="text-align: center;">
          <a href="https://weteamup.app" style="display: inline-block; background-color: #C1FF2F; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Explore Events</a>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; color: #666; font-size: 12px; text-align: center;">
          <p>© ${new Date().getFullYear()} WebPadel. All rights reserved.</p>
        </div>
      </div>
    `
  }),
  
  eventCreated: (event, creator) => ({
    subject: `Event Created: ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1E1E1E; color: white;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/whitepadel.png?alt=media&token=0b125f07-4d49-44a1-a255-2d77744b29d8" alt="WebPadel" style="height: 40px; width: auto;" />
        </div>
        <h2 style="color: #C1FF2F; margin-bottom: 20px;">Your Event Has Been Created!</h2>
        <div style="background-color: #2A2A2A; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #C1FF2F; margin-top: 0;">${event.title}</h3>
          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${event.time} - ${event.endTime}</p>
            <p style="margin: 10px 0;"><strong>Location:</strong> ${event.location}</p>
            <p style="margin: 10px 0;"><strong>Level:</strong> ${event.level}</p>
            <p style="margin: 10px 0;"><strong>Max Players:</strong> ${event.maxPlayers}</p>
            ${event.price > 0 ? `<p style="margin: 10px 0;"><strong>Price:</strong> €${event.price}</p>` : ''}
          </div>
          <p>Invite your friends to join your event!</p>
        </div>
        <div style="text-align: center;">
          <a href="https://weteamup.app" style="display: inline-block; background-color: #C1FF2F; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Manage Your Event</a>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; color: #666; font-size: 12px; text-align: center;">
          <p>© ${new Date().getFullYear()} WebPadel. All rights reserved.</p>
        </div>
      </div>
    `
  }),
  
  eventInvitation: (event, invitedBy) => ({
    subject: `You're Invited: ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1E1E1E; color: white;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/whitepadel.png?alt=media&token=0b125f07-4d49-44a1-a255-2d77744b29d8" alt="WebPadel" style="height: 40px; width: auto;" />
        </div>
        <h2 style="color: #C1FF2F; margin-bottom: 20px;">You're Invited to Join an Event!</h2>
        <div style="background-color: #2A2A2A; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin-bottom: 15px;">${invitedBy.displayName || 'Someone'} has invited you to join:</p>
          <h3 style="color: #C1FF2F; margin-top: 0;">${event.title}</h3>
          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${event.time} - ${event.endTime}</p>
            <p style="margin: 10px 0;"><strong>Location:</strong> ${event.location}</p>
            <p style="margin: 10px 0;"><strong>Level:</strong> ${event.level}</p>
            ${event.price > 0 ? `<p style="margin: 10px 0;"><strong>Price:</strong> €${event.price}</p>` : ''}
          </div>
        </div>
        <div style="text-align: center;">
          <a href="https://weteamup.app" style="display: inline-block; background-color: #C1FF2F; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Event</a>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; color: #666; font-size: 12px; text-align: center;">
          <p>© ${new Date().getFullYear()} WebPadel. All rights reserved.</p>
        </div>
      </div>
    `
  }),
  
  eventReminder: (event, user) => ({
    subject: `Reminder: ${event.title} is starting soon!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1E1E1E; color: white;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/whitepadel.png?alt=media&token=0b125f07-4d49-44a1-a255-2d77744b29d8" alt="WebPadel" style="height: 40px; width: auto;" />
        </div>
        <h2 style="color: #C1FF2F; margin-bottom: 20px;">Your Event Is Starting Soon!</h2>
        <div style="background-color: #2A2A2A; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #C1FF2F; margin-top: 0;">${event.title}</h3>
          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p style="margin: 10px 0;"><strong>Time:</strong> ${event.time} - ${event.endTime}</p>
            <p style="margin: 10px 0;"><strong>Location:</strong> ${event.location}</p>
          </div>
          <p style="margin-bottom: 10px;">Don't forget to bring your gear and arrive on time!</p>
          <p>See you on the court!</p>
        </div>
        <div style="text-align: center;">
          <a href="https://weteamup.app" style="display: inline-block; background-color: #C1FF2F; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Event Details</a>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; color: #666; font-size: 12px; text-align: center;">
          <p>© ${new Date().getFullYear()} WebPadel. All rights reserved.</p>
        </div>
      </div>
    `
  }),
  
  shareMemory: (event) => ({
    subject: `Share Your Memories from ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1E1E1E; color: white;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/whitepadel.png?alt=media&token=0b125f07-4d49-44a1-a255-2d77744b29d8" alt="WebPadel" style="height: 40px; width: auto;" />
        </div>
        <h2 style="color: #C1FF2F; margin-bottom: 20px;">Share Your Event Memories!</h2>
        <div style="background-color: #2A2A2A; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin-bottom: 15px;">Thanks for participating in:</p>
          <h3 style="color: #C1FF2F; margin-top: 0;">${event.title}</h3>
          <div style="margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p style="margin: 10px 0;"><strong>Location:</strong> ${event.location}</p>
          </div>
          <p style="margin-bottom: 15px;">We hope you had a great time! Would you like to share some photos or memories from the event?</p>
          <p>Your shared memories will be visible to other participants and help build our community!</p>
        </div>
        <div style="text-align: center;">
          <a href="https://weteamup.app" style="display: inline-block; background-color: #C1FF2F; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Share Memories</a>
        </div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; color: #666; font-size: 12px; text-align: center;">
          <p>© ${new Date().getFullYear()} WebPadel. All rights reserved.</p>
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
    return true;
  } catch (error) {
    logger.error('Error sending email', { error, to, subject: template.subject });
    return false;
  }
}

// 1. Listen for new user creation to send welcome emails
exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  try {
    // Get additional user data from Firestore if needed
    const userDoc = await admin.firestore().collection('users').doc(user.uid).get();
    
    if (userDoc.exists && userDoc.data().email) {
      const userData = userDoc.data();
      await sendEmail(userData.email, emailTemplates.welcomeEmail(userData));
      logger.info('Welcome email sent to new user', { userId: user.uid });
    } else if (user.email) {
      await sendEmail(user.email, emailTemplates.welcomeEmail(user));
      logger.info('Welcome email sent to new user', { userId: user.uid });
    }
  } catch (error) {
    logger.error('Error sending welcome email', { error, userId: user.uid });
  }
});

// 2. Handle event creation notification
exports.onEventCreation = functions.firestore
  .document('events/{eventId}')
  .onCreate(async (snapshot, context) => {
    try {
      const eventData = snapshot.data();
      const creatorId = eventData.createdBy;
      
      // Get creator info
      const creatorDoc = await admin.firestore().collection('users').doc(creatorId).get();
      
      if (creatorDoc.exists && creatorDoc.data().email) {
        const creatorData = creatorDoc.data();
        await sendEmail(creatorData.email, emailTemplates.eventCreated(eventData, creatorData));
        logger.info('Event creation email sent', { eventId: context.params.eventId });
      }
    } catch (error) {
      logger.error('Error sending event creation email', { error, eventId: context.params.eventId });
    }
  });

// 3. Handle player joining event notification
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
    const newPlayerIds = newData.players
      .filter(player => player !== null)
      .filter(player => 
        !previousData.players.some(prevPlayer => 
          prevPlayer !== null && prevPlayer.id === player.id
        )
      )
      .map(player => player.id);

    // Find removed players (left)
    const removedPlayerIds = previousData.players
      .filter(player => player !== null)
      .filter(player => 
        !newData.players.some(newPlayer => 
          newPlayer !== null && newPlayer.id === player.id
        )
      )
      .map(player => player.id);

    const eventCreatorDoc = await admin.firestore()
      .collection('users')
      .doc(newData.createdBy)
      .get();
    
    const eventCreator = eventCreatorDoc.data();

    // Send notifications for new players
    for (const playerId of newPlayerIds) {
      const playerDoc = await admin.firestore()
        .collection('users')
        .doc(playerId)
        .get();
      
      const player = playerDoc.data();
      
      if (player && player.email) {
        // Email to player
        await sendEmail(player.email, emailTemplates.playerJoined(newData, player));

        // Email to event creator if the creator is not the player
        if (eventCreator && eventCreator.email && playerId !== newData.createdBy) {
          await sendEmail(eventCreator.email, emailTemplates.creatorNewPlayer(newData, player));
        }
      }
    }

    // Send notifications for removed players
    for (const playerId of removedPlayerIds) {
      const playerDoc = await admin.firestore()
        .collection('users')
        .doc(playerId)
        .get();
      
      const player = playerDoc.data();
      
      if (player && player.email) {
        // Email to player
        await sendEmail(player.email, emailTemplates.playerLeft(newData, player));

        // Email to event creator if the creator is not the player
        if (eventCreator && eventCreator.email && playerId !== newData.createdBy) {
          await sendEmail(eventCreator.email, emailTemplates.creatorPlayerLeft(newData, player));
        }
      }
    }
  });

// 4. Schedule function to send event reminders (runs every hour)
exports.sendEventReminders = onSchedule("every 60 minutes", async (context) => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    // Format dates to match Firestore format (YYYY-MM-DD)
    const todayStr = now.toISOString().split('T')[0];
    
    // Get events happening within the next hour
    const eventsSnapshot = await admin.firestore()
      .collection('events')
      .where('date', '==', todayStr)
      .where('status', '==', 'active')
      .get();
    
    if (eventsSnapshot.empty) {
      logger.info('No upcoming events found for reminders');
      return;
    }
    
    // Process each event
    for (const doc of eventsSnapshot.docs) {
      const event = doc.data();
      
      // Check if event starts within the next hour
      const [eventHours, eventMinutes] = event.time.split(':').map(Number);
      const eventTime = new Date(now);
      eventTime.setHours(eventHours, eventMinutes, 0, 0);
      
      // Only process events starting in the next hour
      if (eventTime > now && eventTime <= oneHourLater) {
        logger.info('Sending reminders for event starting soon', { eventId: doc.id, eventTime: event.time });
        
        // Get all confirmed players
        const players = event.players.filter(player => player !== null);
        
        // Send reminder to each player
        for (const player of players) {
          const playerDoc = await admin.firestore()
            .collection('users')
            .doc(player.id)
            .get();
          
          if (playerDoc.exists && playerDoc.data().email) {
            await sendEmail(
              playerDoc.data().email, 
              emailTemplates.eventReminder(event, playerDoc.data())
            );
            logger.info('Event reminder sent', { eventId: doc.id, userId: player.id });
          }
        }
      }
    }
    
    logger.info('Event reminder check completed');
  } catch (error) {
    logger.error('Error sending event reminders', { error });
  }
});

// 5. Schedule function to send memory sharing invitations (runs every 6 hours)
exports.sendMemorySharingInvites = onSchedule("every 6 hours", async (context) => {
  try {
    const now = new Date();
    
    // Check for events that ended recently (within the last 24 hours)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = oneDayAgo.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    
    // Get events that recently ended
    const eventsSnapshot = await admin.firestore()
      .collection('events')
      .where('date', 'in', [yesterdayStr, todayStr])
      .where('status', '==', 'completed')
      .get();
    
    if (eventsSnapshot.empty) {
      logger.info('No recently completed events found for memory sharing');
      return;
    }
    
    // Keep track of which events already had memory requests sent
    const memoryRequestsSnapshot = await admin.firestore()
      .collection('memoryRequests')
      .get();
    
    const sentEventIds = new Set(
      memoryRequestsSnapshot.docs.map(doc => doc.data().eventId)
    );
    
    // Process each event
    for (const doc of eventsSnapshot.docs) {
      const event = doc.data();
      const eventId = doc.id;
      
      // Skip if we already sent memory sharing invites for this event
      if (sentEventIds.has(eventId)) {
        continue;
      }
      
      // Check event end time 
      const [endHours, endMinutes] = event.endTime.split(':').map(Number);
      const eventDate = new Date(event.date);
      eventDate.setHours(endHours, endMinutes, 0, 0);
      
      // Only process events that ended between 1-24 hours ago
      if (eventDate < now && eventDate >= oneDayAgo) {
        logger.info('Sending memory sharing invites for event', { eventId });
        
        // Get all players who participated
        const players = event.players.filter(player => player !== null);
        
        // Record that we're sending memory requests for this event
        await admin.firestore()
          .collection('memoryRequests')
          .add({
            eventId,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            playerCount: players.length
          });
        
        // Send invite to each player
        for (const player of players) {
          const playerDoc = await admin.firestore()
            .collection('users')
            .doc(player.id)
            .get();
          
          if (playerDoc.exists && playerDoc.data().email) {
            await sendEmail(
              playerDoc.data().email,
              emailTemplates.shareMemory(event)
            );
            logger.info('Memory sharing invite sent', { eventId, userId: player.id });
          }
        }
      }
    }
    
    logger.info('Memory sharing invites check completed');
  } catch (error) {
    logger.error('Error sending memory sharing invites', { error });
  }
});
