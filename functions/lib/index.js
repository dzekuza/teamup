"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendFeedbackEmail = exports.checkUserProfileCompletion = exports.generateEventMetaTags = exports.sendMemorySharingInvites = exports.sendEventReminders = exports.onEventUpdate = exports.onEventCreation = exports.createCheckoutSession = exports.sendWelcomeEmail = exports.sendEventCreationEmail = exports.sendEventInvitationEmail = exports.createUserAccount = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1")); // Explicitly use v1 SDK
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Define API Keys / Initialize SDKs (moved to respective files like stripe.ts)
// const stripeSecretKey = defineString("STRIPE_SECRET"); // Moved to stripe.ts
// Initialize Stripe (moved to stripe.ts)
/*
const stripe = new Stripe(stripeSecretKey.value(), {
  apiVersion: '2024-04-10',
});
*/
// Initialize Firestore (moved to stripe.ts or other files as needed)
// const db = admin.firestore();
// Export all functions from the imported files
exports.createUserAccount = authFunctions.createUserAccount;
exports.sendEventInvitationEmail = emailFunctions.sendEventInvitationEmail;
exports.sendEventCreationEmail = emailFunctions.sendEventCreationEmail;
exports.sendWelcomeEmail = emailFunctions.sendWelcomeEmail;
exports.createCheckoutSession = stripeFunctions.createCheckoutSession; // Export from stripe.ts
/**
 * Firestore Trigger (v1 syntax)
 */
exports.onEventCreation = functions.firestore
    .document("events/{eventId}")
    .onCreate(async (snap, context) => {
    try {
      const eventData = snap.data();
      const creatorId = eventData.createdBy;

      // Get creator's info
      const creatorDoc = await admin.firestore().collection('users').doc(creatorId).get();
      const creatorData = creatorDoc.data();

      // Create notification for all users except creator
      const usersSnapshot = await admin.firestore().collection('users').get();
      const batch = admin.firestore().batch();

      usersSnapshot.docs.forEach((doc) => {
        if (doc.id !== creatorId) {
          const notificationRef = admin.firestore().collection('notifications').doc();
          batch.set(notificationRef, {
            type: 'new_event',
            eventId: context.params.eventId,
            eventTitle: eventData.title,
            createdBy: creatorId,
            creatorName: creatorData.displayName || 'Unknown User',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            read: false,
            userId: doc.id
          });
        }
      });

      await batch.commit();
    } catch (error) {
      console.error('Error creating notifications:', error);
    }
});
/**
 * Firestore Trigger (v1 syntax)
 */
exports.onEventUpdate = functions.firestore
    .document("events/{eventId}")
    .onUpdate((change, context) => {
    console.log("Event updated (v1 trigger):", context.params.eventId);
    const beforeData = change.before.data();
    const afterData = change.after.data();
    console.log("Before:", beforeData);
    console.log("After:", afterData);
    // Add your logic here, e.g., checking for significant changes
    return null; // Indicate success
});
// Scheduled function (v1 syntax)
exports.sendEventReminders = functions.pubsub.schedule("every 60 minutes").onRun(async (context) => {
    console.log("Running scheduled reminder check (v1 trigger)");
    // Implementation remains the same...
});
// Callable Function to send memory sharing invites
exports.sendMemorySharingInvites = functions.https.onCall(async (data, context) => {
    // Implementation remains the same...
});
// HTTPS Function to generate dynamic meta tags for event sharing
exports.generateEventMetaTags = functions.https.onRequest(async (req, res) => {
    // Implementation remains the same...
});
// Callable Function to check user profile completion
exports.checkUserProfileCompletion = functions.https.onCall(async (data, context) => {
    // Implementation remains the same...
});
// Callable function to send feedback via SendGrid
exports.sendFeedbackEmail = functions.https.onCall(async (data, context) => {
    // Implementation remains the same...
});
// --- Stripe Integration Functions ---
// Removed duplicate definition of createCheckoutSession
/*
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  // ... duplicate code removed ...
});
*/
// TODO: Add Stripe Webhook function (stripeWebhook) here

exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    const userRef = admin.firestore().collection('users').doc(user.uid);
    await userRef.set({
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isAdmin: false
    });
  } catch (error) {
    console.error('Error creating user document:', error);
  }
});

exports.onEventJoined = functions.firestore
  .document('events/{eventId}')
  .onUpdate(async (change, context) => {
    try {
      const newData = change.after.data();
      const previousData = change.before.data();

      // Check if players array has changed
      if (JSON.stringify(newData.players) === JSON.stringify(previousData.players)) {
        return null;
      }

      const newPlayers = newData.players.filter(player => 
        !previousData.players.some(p => p.id === player.id)
      );

      if (newPlayers.length === 0) {
        return null;
      }

      const newPlayer = newPlayers[0];
      const eventCreator = newData.createdBy;

      // Create notification for event creator
      const notificationRef = admin.firestore().collection('notifications').doc();
      await notificationRef.set({
        type: 'player_joined',
        eventId: context.params.eventId,
        eventTitle: newData.title,
        playerId: newPlayer.id,
        playerName: newPlayer.name,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
        userId: eventCreator
      });

      return null;
    } catch (error) {
      console.error('Error creating player joined notification:', error);
      return null;
    }
  });

//# sourceMappingURL=index.js.map