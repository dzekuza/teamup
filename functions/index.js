/* eslint-disable max-len */
/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Import necessary V2 modules
const {onRequest, onCall, HttpsError} = require("firebase-functions/v2/https");
const {onDocumentCreated, onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
// const {onUserCreated} = require("firebase-functions/v2/auth"); // Removed V2 Auth
const {defineSecret} = require("firebase-functions/params"); // Re-add for V2 secrets
// const functions = require("firebase-functions"); // Use V1 functions - REMOVED
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail"); // Re-add SendGrid
const fetch = require("node-fetch");

admin.initializeApp();

// Define SendGrid Secrets (Needed for V2 functions)
const sendgridApiKey = defineSecret("SENDGRID_API_KEY");
const sendgridFromEmail = defineSecret("SENDGRID_FROM_EMAIL");

// Initialize SendGrid Client - Use functions.config() within the V1 function

// 1. Listen for new user creation to send welcome emails - V1 Syntax using functions.config() - COMMENTED OUT
/*
exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  if (!user || !user.email) {
    logger.info("User data or email missing, cannot send welcome email.", {uid: user?.uid});
    return;
  }

  try {
    // Access config within the function
    const apiKey = functions.config().sendgrid?.key;
    const fromEmail = functions.config().sendgrid?.from_email;

    if (!apiKey) {
      logger.error("SendGrid API Key not found in functions config (sendgrid.key)");
      return;
    }
    if (!fromEmail) {
      logger.error("SendGrid From Email not found in functions config (sendgrid.from_email)");
      return;
    }

    sgMail.setApiKey(apiKey);

    const msg = {
      to: user.email,
      from: fromEmail,
      subject: "Welcome to WebPadel!",
      text: `Hi ${user.displayName || "there"},\n\nWelcome to WebPadel! We're excited to have you.\n\nFind games and connect with players at https://weteamup.app \n\nSee you on the court! 🎾`,
    };

    await sgMail.send(msg);
    logger.info("Welcome email sent successfully via SendGrid (V1 Trigger)", {userId: user.uid, email: user.email});
  } catch (error) {
    logger.error("Error sending welcome email via SendGrid (V1 Trigger)", {
      error: error.response ? error.response.body : error.message,
      userId: user.uid,
    });
  }
});
*/

// 2. Handle event creation notification (V2) - Re-enabled SendGrid email
exports.onEventCreation = onDocumentCreated({secrets: [sendgridApiKey, sendgridFromEmail], document: "events/{eventId}"}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.error("No data associated with the event: onEventCreation");
    return;
  }
  try {
    const eventData = snapshot.data();
    const creatorId = eventData.createdBy;

    // Get creator info
    const creatorDoc = await admin.firestore().collection("users").doc(creatorId).get();

    if (creatorDoc.exists && creatorDoc.data().email) {
      const creatorData = creatorDoc.data();
      const creatorEmail = creatorData.email;

      // Initialize SendGrid
      sgMail.setApiKey(sendgridApiKey.value());

      // Construct email
      const msg = {
        to: creatorEmail,
        from: sendgridFromEmail.value(),
        subject: `Event Created: ${eventData.title}`,
        text: `Hi ${creatorData.displayName || "there"},\n\nYour event "${eventData.title}" has been successfully created!\n\nDate: ${new Date(eventData.date).toLocaleDateString()}\nTime: ${eventData.time} - ${eventData.endTime || "N/A"}\nLocation: ${eventData.location}\n\nYou can view and manage your event here: https://teamup.lt/event/${event.id}\n\nInvite some friends! 🎾`,
        // html: "<strong>Optional HTML version</strong>",
      };

      // Send email
      await sgMail.send(msg);
      logger.info("Event creation email sent via SendGrid", {eventId: event.id, creatorEmail: creatorEmail});
    } else {
      logger.warn("Creator email not found, cannot send event creation email.", {eventId: event.id, creatorId: creatorId});
    }
  } catch (error) {
    logger.error("Error processing event creation email", {
      error: error.response ? error.response.body : error.message,
      eventId: event.id,
    });
  }
});

// 3. Handle player joining event notification (V2) - Uncommented
exports.onEventUpdate = onDocumentUpdated({secrets: [sendgridApiKey, sendgridFromEmail], document: "events/{eventId}"}, async (event) => {
  const change = event.data;
  if (!change || !change.before || !change.after) {
    logger.error("No before/after data associated with the event: onEventUpdate");
    return;
  }
  const newData = change.after.data();
  const previousData = change.before.data();

  // Check if players list has changed
  if (JSON.stringify(newData.players) === JSON.stringify(previousData.players)) {
    return null;
  }

  // Find new players (joined)
  const newPlayerIds = newData.players
      .filter((player) => player !== null)
      .filter((player) =>
        !previousData.players.some((prevPlayer) =>
          prevPlayer !== null && prevPlayer.id === player.id,
        ),
      )
      .map((player) => player.id);

  // Find removed players (left)
  const removedPlayerIds = previousData.players
      .filter((player) => player !== null)
      .filter((player) =>
        !newData.players.some((newPlayer) =>
          newPlayer !== null && newPlayer.id === player.id,
        ),
      )
      .map((player) => player.id);

  const eventCreatorDoc = await admin.firestore()
      .collection("users")
      .doc(newData.createdBy)
      .get();

  const eventCreator = eventCreatorDoc.data();

  // Send notifications for new players
  for (const playerId of newPlayerIds) {
    const playerDoc = await admin.firestore()
        .collection("users")
        .doc(playerId)
        .get();

    const player = playerDoc.data();

    if (player && player.email) {
      // Email to player - Removed
      // await sendEmail(player.email, emailTemplates.playerJoined(newData, player));

      // Email to event creator if the creator is not the player - Removed
      if (eventCreator && eventCreator.email && playerId !== newData.createdBy) {
        // await sendEmail(eventCreator.email, emailTemplates.creatorNewPlayer(newData, player));
      }
      logger.info("New player joined processed (email sending removed)", {eventId: event.id, userId: playerId});
    }
  }

  // Send notifications for removed players
  for (const playerId of removedPlayerIds) {
    const playerDoc = await admin.firestore()
        .collection("users")
        .doc(playerId)
        .get();

    const player = playerDoc.data();

    if (player && player.email) {
      // Email to player - Removed
      // await sendEmail(player.email, emailTemplates.playerLeft(newData, player));

      // Email to event creator if the creator is not the player - Removed
      if (eventCreator && eventCreator.email && playerId !== newData.createdBy) {
        // await sendEmail(eventCreator.email, emailTemplates.creatorPlayerLeft(newData, player));
      }
      logger.info("Player left processed (email sending removed)", {eventId: event.id, userId: playerId});
    }
  }
});

// 4. Schedule function to send event reminders (runs every hour) - Already V2 - Uncommented
exports.sendEventReminders = onSchedule({secrets: [sendgridApiKey, sendgridFromEmail], schedule: "every 60 minutes"}, async (context) => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Format dates to match Firestore format (YYYY-MM-DD)
    const todayStr = now.toISOString().split("T")[0];

    // Get events happening within the next hour
    const eventsSnapshot = await admin.firestore()
        .collection("events")
        .where("date", "==", todayStr)
        .where("status", "==", "active")
        .get();

    if (eventsSnapshot.empty) {
      logger.info("No upcoming events found for reminders");
      return;
    }

    // Process each event
    for (const doc of eventsSnapshot.docs) {
      const event = doc.data();

      // Check if event starts within the next hour
      const [eventHours, eventMinutes] = event.time.split(":").map(Number);
      const eventTime = new Date(now);
      eventTime.setHours(eventHours, eventMinutes, 0, 0);

      // Only process events starting in the next hour
      if (eventTime > now && eventTime <= oneHourLater) {
        logger.info("Sending reminders for event starting soon", {eventId: doc.id, eventTime: event.time});

        // Get all confirmed players
        const players = event.players.filter((player) => player !== null);

        // Send reminder to each player
        for (const player of players) {
          const playerDoc = await admin.firestore()
              .collection("users")
              .doc(player.id)
              .get();

          if (playerDoc.exists && playerDoc.data().email) {
            // await sendEmail( // Removed
            //     playerDoc.data().email,
            //     emailTemplates.eventReminder(event, playerDoc.data()),
            // );
            logger.info("Event reminder processed (email sending removed)", {eventId: doc.id, userId: player.id});
          }
        }
      }
    }

    logger.info("Event reminder check completed");
  } catch (error) {
    logger.error("Error sending event reminders", {error});
  }
});

// 5. Schedule function to send memory sharing invitations (runs every 6 hours) - Already V2 - Uncommented
exports.sendMemorySharingInvites = onSchedule({secrets: [sendgridApiKey, sendgridFromEmail], schedule: "every 6 hours"}, async (context) => {
  try {
    const now = new Date();

    // Check for events that ended recently (within the last 24 hours)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = oneDayAgo.toISOString().split("T")[0];
    const todayStr = now.toISOString().split("T")[0];

    // Get events that recently ended
    const eventsSnapshot = await admin.firestore()
        .collection("events")
        .where("date", "in", [yesterdayStr, todayStr])
        .where("status", "==", "completed")
        .get();

    if (eventsSnapshot.empty) {
      logger.info("No recently completed events found for memory sharing");
      return;
    }

    // Keep track of which events already had memory requests sent
    const memoryRequestsSnapshot = await admin.firestore()
        .collection("memoryRequests")
        .get();

    const sentEventIds = new Set(
        memoryRequestsSnapshot.docs.map((doc) => doc.data().eventId),
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
      const [endHours, endMinutes] = event.endTime.split(":").map(Number);
      const eventDate = new Date(event.date);
      eventDate.setHours(endHours, endMinutes, 0, 0);

      // Only process events that ended between 1-24 hours ago
      if (eventDate < now && eventDate >= oneDayAgo) {
        logger.info("Sending memory sharing invites for event", {eventId});

        // Get all players who participated
        const players = event.players.filter((player) => player !== null);

        // Record that we're sending memory requests for this event
        await admin.firestore()
            .collection("memoryRequests")
            .add({
              eventId,
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              playerCount: players.length,
            });

        // Send invite to each player
        for (const player of players) {
          const playerDoc = await admin.firestore()
              .collection("users")
              .doc(player.id)
              .get();

          if (playerDoc.exists && playerDoc.data().email) {
            // await sendEmail( // Removed
            //     playerDoc.data().email,
            //     emailTemplates.shareMemory(event),
            // );
            logger.info("Memory sharing invite processed (email sending removed)", {eventId, userId: player.id});
          }
        }
      }
    }

    logger.info("Memory sharing invites check completed");
  } catch (error) {
    logger.error("Error sending memory sharing invites", {error});
  }
});

// 6. Generate Event Meta Tags (V2) - Uncommented
exports.generateEventMetaTags = onRequest(async (req, res) => {
  // Enable CORS for testing if needed, restrict in production
  res.set("Access-Control-Allow-Origin", "*");

  const hostingUrl = "https://teamup.lt"; // Corrected URL
  const defaultImageUrl = "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/cover%20social%20team.jpg?alt=media&token=fbefaddc-fb93-4ba8-be0b-24db7a1adcea"; // Updated default image
  const defaultTitle = "TeamUp: Create Or Join Any Sport Event Around You"; // Updated default title
  const defaultDescription = "TeamUp: Create Or Join Any Sport Event Around You"; // Updated default description

  try {
    // 1. Fetch the base index.html from hosting
    const indexResponse = await fetch(hostingUrl);
    if (!indexResponse.ok) {
      throw new Error(`Failed to fetch index.html: ${indexResponse.statusText}`);
    }
    let indexHTML = await indexResponse.text();

    // 2. Extract event ID from request path (e.g., /event/123)
    const pathParts = req.path.split("/");
    const eventId = pathParts.length > 2 ? pathParts[2] : null;

    let metaTags = "";

    // 3. If event ID exists, fetch event data
    if (eventId) {
      const eventRef = admin.firestore().collection("events").doc(eventId);
      const eventDoc = await eventRef.get();

      if (eventDoc.exists) {
        const eventData = eventDoc.data();
        const title = eventData.title || defaultTitle;
        const description = eventData.description || defaultDescription;
        // Determine image: Use coverImageURL, fallback to location image logic (simplified here), then default
        // Note: Accessing PADEL_LOCATIONS might be complex server-side, simplify fallback logic
        const imageUrl = eventData.coverImageURL || defaultImageUrl;
        const eventUrl = `${hostingUrl}${req.path}`; // Canonical URL

        // 4. Construct Meta Tags
        metaTags = `
          <meta property="og:title" content="${title}" />
          <meta property="og:description" content="${description}" />
          <meta property="og:image" content="${imageUrl}" />
          <meta property="og:url" content="${eventUrl}" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${title}" />
          <meta name="twitter:description" content="${description}" />
          <meta name="twitter:image" content="${imageUrl}" />
        `;
      } else {
        // Event not found, use default tags
        console.warn(`Event not found: ${eventId}`);
        metaTags = `
          <meta property="og:title" content="${defaultTitle}" />
          <meta property="og:description" content="${defaultDescription}" />
          <meta property="og:image" content="${defaultImageUrl}" />
          <meta property="og:url" content="${hostingUrl}" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content="${defaultTitle}" />
          <meta name="twitter:description" content="${defaultDescription}" />
          <meta name="twitter:image" content="${defaultImageUrl}" />
        `;
      }
    } else {
      // No event ID (e.g., root path), use default tags
      metaTags = `
          <meta property="og:title" content="${defaultTitle}" />
          <meta property="og:description" content="${defaultDescription}" />
          <meta property="og:image" content="${defaultImageUrl}" />
          <meta property="og:url" content="${hostingUrl}" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content="${defaultTitle}" />
          <meta name="twitter:description" content="${defaultDescription}" />
          <meta name="twitter:image" content="${defaultImageUrl}" />
        `;
    }

    // 5. Inject meta tags into <head>
    indexHTML = indexHTML.replace("<head>", `<head>\n${metaTags}`);

    // 6. Send the modified HTML
    res.status(200).send(indexHTML);
  } catch (error) {
    console.error("Error generating meta tags:", error);
    // Fallback: Serve original index.html or send an error
    // Fetching index again in case of error during meta tag generation
    try {
      const fallbackResponse = await fetch(hostingUrl);
      if (fallbackResponse.ok) {
        const fallbackHTML = await fallbackResponse.text();
        res.status(500).send(fallbackHTML);
      } else {
        res.status(500).send("Error processing request and failed to fetch fallback content.");
      }
    } catch (fallbackError) {
      console.error("Error fetching fallback index.html:", fallbackError);
      res.status(500).send("Internal Server Error");
    }
  }
});

// 5. Handle new user creation - Check user profile completion - V2
// Assuming profile completion is tracked by a specific field, e.g., 'profileComplete'
exports.checkUserProfileCompletion = onDocumentCreated({document: "users/{userId}"}, async (event) => {
  // ... (rest of this function seems incomplete or unrelated - keeping it for now)
  // logger.info("New user created, checking profile completion.");
});

// --- NEW FUNCTION --- //
// 6. HTTPS Callable Function to send feedback email
exports.sendFeedbackEmail = onCall({secrets: [sendgridApiKey, sendgridFromEmail]}, async (request) => {
  // For onCall, data is in request.data, context is the second argument (implicit here or use request.auth)
  const {feedbackType, feedbackMessage} = request.data;

  // Basic validation
  if (!feedbackType || !feedbackMessage) {
    logger.error("Missing feedbackType or feedbackMessage in request data.", {data: request.data});
    // Throw HttpsError (imported from v2/https)
    throw new HttpsError(
        "invalid-argument",
        "Feedback type and message are required.",
    );
  }

  // Get authenticated user info from context
  let userInfo = "Anonymous User";
  const uid = request.auth?.uid;
  const email = request.auth?.token.email;

  if (uid && email) {
    userInfo = `User: ${email} (ID: ${uid})`;
  } else if (uid) {
    userInfo = `User ID: ${uid}`;
  } else if (email) { // This case is unlikely without uid but included for completeness
    userInfo = `User Email: ${email}`;
  }

  // Set up SendGrid
  try {
    sgMail.setApiKey(sendgridApiKey.value());
    const recipientEmail = "info@teamup.lt"; // Your target email
    const senderEmail = sendgridFromEmail.value(); // Your verified sender email

    const msg = {
      to: recipientEmail,
      from: senderEmail,
      subject: `New Feedback Received: [${feedbackType}]`,
      text: `New feedback submitted:\n\nType: ${feedbackType}\n\nMessage:\n${feedbackMessage}\n\nSubmitted by: ${userInfo}`,
      // Optionally add HTML content
      // html: `<p>New feedback submitted:</p>...`,
    };

    await sgMail.send(msg);
    logger.info("Feedback email sent successfully via SendGrid.", {type: feedbackType, userInfo: userInfo});
    // Return success object for onCall
    return {success: true};
  } catch (error) {
    logger.error("Error sending feedback email via SendGrid", {
      error: error.response ? error.response.body : error.message,
      feedbackType: feedbackType,
      userInfo: userInfo,
    });
    // Throw HttpsError (imported from v2/https)
    throw new HttpsError(
        "internal",
        "Failed to send feedback email.",
        error, // Optionally include original error details
    );
  }
});
