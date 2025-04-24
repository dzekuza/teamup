import * as admin from "firebase-admin";

// Ensure Firebase Admin is initialized
// It's often done in index.ts, check there first.
// if (admin.apps.length === 0) { // Check if already initialized
//   admin.initializeApp();
// }

import * as functions from "firebase-functions";
import Stripe from "stripe";

// Get Stripe secret key from Firebase config
const stripeSecretKey = functions.config().stripe.secret_key;
if (!stripeSecretKey) {
  console.error("Stripe secret key not configured. " +
    "Run 'firebase functions:config:set stripe.secret_key=YOUR_SECRET_KEY'");
  throw new functions.https.HttpsError(
      "internal", "Stripe configuration error.");
}
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16", // Use a version compatible with the library/Firebase extension
});

// Get Stripe webhook secret from Firebase config
const webhookSecret = functions.config().stripe.webhook_secret;
if (!webhookSecret) {
  console.error("Stripe webhook secret not configured. " +
    "Run 'firebase functions:config:set stripe.webhook_secret=YOUR_SECRET'");
  // Don't throw here, webhook might not be used immediately
}


/**
 * Creates a Stripe Checkout session for a paid event.
 *
 * Expected data: { eventId: string, amount: number, currency: string, successUrl: string, cancelUrl: string }
 * Requires authenticated user context.
 */
export const createStripeCheckoutSession = functions.region("europe-west1").https.onCall(async (data, context) => {
  // 1. Check Authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated", "The function must be called while authenticated.");
  }
  const userId = context.auth.uid;

  // 2. Validate Input Data
  const {eventId, amount, currency, successUrl, cancelUrl} = data;
  if (!eventId || !amount || !currency || !successUrl || !cancelUrl) {
    throw new functions.https.HttpsError(
        "invalid-argument", "Missing required data: eventId, amount, currency, successUrl, cancelUrl.");
  }
  if (typeof amount !== "number" || amount <= 0) {
    throw new functions.https.HttpsError(
        "invalid-argument", "Amount must be a positive number.");
  }
  // TODO: Add more validation - check currency code, URL formats?

  // 3. Fetch Event Data (Optional but Recommended)
  // You might want to fetch the event from Firestore to:
  // - Verify the amount matches the event's price.
  // - Get the event title for the checkout page description.
  let eventTitle = "Event Payment"; // Default title
  try {
    const eventDoc = await admin.firestore().collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Event not found.");
    }
    const eventData = eventDoc.data();
    // TODO: Verify eventData.price matches the provided amount (converted to cents)
    // TODO: Verify eventData.currency matches the provided currency
    if (eventData?.title) {
      eventTitle = eventData.title;
    }
  } catch (error) {
    console.error("Error fetching event:", error);
    throw new functions.https.HttpsError("internal", "Could not fetch event details.");
  }

  // 4. Create Stripe Checkout Session
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // Add other methods like 'ideal', 'sepa_debit' if needed
      line_items: [{
        price_data: {
          currency: currency,
          product_data: {
            name: eventTitle,
            // You can add more details like event description or image URL here
            // images: [eventData?.coverImageURL]
          },
          // Amount should be in the smallest currency unit (e.g., cents)
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: successUrl, // URL to redirect to on successful payment
      cancel_url: cancelUrl, // URL to redirect to if payment is cancelled
      // Attach metadata to link the session back to your user and event
      metadata: {
        userId: userId,
        eventId: eventId,
      },
      // (Optional) Pre-fill customer email if available
      // customer_email: context.auth.token.email,
    });

    // 5. Return Session ID
    if (!session.id) {
      throw new Error("Failed to create Stripe session ID.");
    }
    return {sessionId: session.id};
  } catch (error) {
    console.error("Stripe Checkout Session creation failed:", error);
    throw new functions.https.HttpsError("internal", "Could not create payment session.");
  }
});


/**
 * Handles Stripe webhook events, specifically 'checkout.session.completed'.
 */
export const stripeWebhook = functions.region("europe-west1").https.onRequest(async (request, response) => {
  if (!webhookSecret) {
    console.error("Webhook secret not configured.");
    response.status(400).send("Webhook secret not configured.");
    return;
  }

  const sig = request.headers["stripe-signature"];
  let event: Stripe.Event;

  // 1. Verify Webhook Signature
  try {
    if (!sig) {
      throw new Error("Missing stripe-signature header");
    }
    // Use stripe.webhooks.constructEvent with the raw body buffer
    event = stripe.webhooks.constructEvent(request.rawBody, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Webhook signature verification failed.";
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    response.status(400).send(`Webhook Error: ${errorMessage}`);
    return;
  }

  // 2. Handle the 'checkout.session.completed' event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Extract metadata
    const userId = session.metadata?.userId;
    const eventId = session.metadata?.eventId;
    const paymentStatus = session.payment_status; // Should be 'paid'

    if (paymentStatus === "paid" && userId && eventId) {
      console.log(`Payment successful for user ${userId}, event ${eventId}`);

      // 3. Update Firestore Database
      try {
        const eventRef = admin.firestore().collection("events").doc(eventId);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) {
          console.error(`Event ${eventId} not found in Firestore.`);
          // Decide how to handle - maybe log and return 200 to Stripe anyway?
          response.status(404).send("Event not found");
          return;
        }

        const eventData = eventDoc.data();
        const players = eventData?.players || [];

        // Find the player and update their payment status
        let playerUpdated = false;
        const updatedPlayers = players.map((player: any) => {
          if (player && player.id === userId) {
            playerUpdated = true;
            return {...player, paymentStatus: "paid"}; // Add payment status
          }
          return player;
        });

        if (playerUpdated) {
          await eventRef.update({players: updatedPlayers});
          console.log(`Firestore updated for user ${userId}, event ${eventId}`);
        } else {
          console.warn(`User ${userId} not found in players list for event ${eventId}. ` +
            `Could not update payment status.`); // Still might want to return 200 to Stripe if the payment itself was valid
        }
      } catch (dbError) {
        console.error("Firestore update failed:", dbError);
        // Return 500 so Stripe knows to retry the webhook later
        response.status(500).send("Failed to update database.");
        return;
      }
    } else {
      console.log(`Unhandled checkout session status: ${paymentStatus} for event ${eventId}`);
    }
  } else {
    console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  // 4. Acknowledge receipt of the event to Stripe
  response.status(200).send("Received");
});
