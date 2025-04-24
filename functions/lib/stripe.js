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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.createCheckoutSession = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1")); // Use v1 for consistency
const stripe_1 = __importDefault(require("stripe"));
const params_1 = require("firebase-functions/params");
const firestore_1 = require("firebase-admin/firestore"); // Correct import for Timestamp
// Ensure Firebase Admin is initialized
// It's often done in index.ts, check there first.
// if (admin.apps.length === 0) { // Check if already initialized
//   admin.initializeApp();
// }
// Get Stripe secret key from Firebase config
const stripeSecretKey = functions.config().stripe.secret_key;
if (!stripeSecretKey) {
    console.error("Stripe secret key not configured. " +
        "Run 'firebase functions:config:set stripe.secret_key=YOUR_SECRET_KEY'");
    throw new functions.https.HttpsError("internal", "Stripe configuration error.");
}
const stripe = new stripe_1.default(stripeSecretKey);
// Get Stripe webhook secret from Firebase config
const webhookSecret = functions.config().stripe.webhook_secret;
if (!webhookSecret) {
    console.error("Stripe webhook secret not configured. " +
        "Run 'firebase functions:config:set stripe.webhook_secret=YOUR_SECRET'");
    // Don't throw here, webhook might not be used immediately
}
// Ensure Firebase Admin is initialized (might be done in index.ts, but safe to check)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
// Define Stripe Secret Key from environment
const stripeSecretKeyEnv = (0, params_1.defineString)("STRIPE_SECRET");
// Initialize Stripe
// Ensure you use a supported API version. Check Stripe docs for the latest stable version.
const stripeEnv = new stripe_1.default(stripeSecretKeyEnv.value() || process.env.STRIPE_SECRET || "");
/**
 * Creates a Stripe Checkout Session for initiating a subscription.
 */
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
    var _a;
    // 1. Check Authentication
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in to subscribe.");
    }
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email; // Get user email for Stripe customer creation
    const priceId = data.priceId; // Price ID passed from the client
    if (!priceId) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'priceId'.");
    }
    if (!userEmail) {
        throw new functions.https.HttpsError("failed-precondition", "User email is missing. Cannot create Stripe customer.");
    }
    try {
        // 2. Find or Create Stripe Customer
        let customerId;
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.data();
        if (userData === null || userData === void 0 ? void 0 : userData.stripeCustomerId) {
            customerId = userData.stripeCustomerId;
            // Optional: Verify the customer exists in Stripe
            try {
                if (customerId) {
                    await stripeEnv.customers.retrieve(customerId);
                    console.log(`Using existing Stripe customer ${customerId} for user ${userId}`);
                }
                else {
                    console.warn(`User ${userId} had stripeCustomerId in Firestore, ` +
                        `but it was empty/null. Creating new Stripe customer.`);
                    // customerId remains undefined, forcing creation below
                }
            }
            catch (error) {
                // If customer doesn't exist in Stripe (e.g., deleted manually), create a new one
                if (error.code === "resource_missing") {
                    console.warn(`Stripe customer ${customerId} not found for user ${userId}. Creating a new one.`);
                    customerId = undefined; // Force creation below
                }
                else {
                    console.error(`Error retrieving Stripe customer ${customerId}:`, error);
                    throw error; // Re-throw other Stripe errors
                }
            }
        }
        // If no customerId found in Firestore or verification failed, create a new Stripe customer
        if (!customerId) {
            console.log(`Creating new Stripe customer for user ${userId} with email ${userEmail}`);
            const customer = await stripeEnv.customers.create({
                email: userEmail, // Use user's email
                metadata: { firebaseUID: userId }, // Link Stripe customer to Firebase user
            });
            customerId = customer.id;
            console.log(`Created Stripe customer ${customerId} for user ${userId}. Updating Firestore.`);
            // Update Firestore with the new Stripe Customer ID
            await userRef.update({ stripeCustomerId: customerId });
        }
        // 3. Create Stripe Checkout Session
        console.log(`Creating checkout session for customer ${customerId} with price ${priceId}`);
        // Determine the base URL dynamically or from environment variables
        const appBaseUrl = process.env.APP_URL || ((_a = functions.config().app) === null || _a === void 0 ? void 0 : _a.url) || "http://localhost:3000";
        const session = await stripeEnv.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription", // Specify subscription mode
            customer: customerId, // Associate with the Stripe customer
            line_items: [
                {
                    price: priceId, // The Price ID from the client
                    quantity: 1,
                },
            ],
            // Define success and cancel URLs - client-side URLs where Stripe redirects
            success_url: `${appBaseUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appBaseUrl}/subscription-canceled`,
            // Optional: Allow promo codes
            allow_promotion_codes: true,
            // Optional: Collect billing address if needed for tax/compliance
            // billing_address_collection: 'required',
            // Optional: Add trial period if applicable (defined on the Price or here)
            // subscription_data: {
            //   trial_period_days: 14,
            // },
            metadata: {
                firebaseUID: userId, // Pass Firebase UID for webhook reference
            },
        });
        // 4. Return the Session ID
        console.log(`Checkout session ${session.id} created successfully.`);
        return { sessionId: session.id };
    }
    catch (error) {
        console.error("Error creating Stripe checkout session:", error);
        if (error instanceof Error) {
            throw new functions.https.HttpsError("internal", `Could not create checkout session: ${error.message}`);
        }
        else {
            throw new functions.https.HttpsError("internal", "An unknown error occurred while creating the checkout session.");
        }
    }
});
/**
 * Handles incoming Stripe Webhook events.
 */
exports.stripeWebhook = functions.https.onRequest(async (request, response) => {
    var _a, _b, _c;
    if (!webhookSecret) {
        console.error("Webhook processing failed: Webhook secret is not configured.");
        response.status(400).send("Webhook Error: Server configuration error.");
        return;
    }
    const sig = request.headers["stripe-signature"];
    let event;
    try {
        // 1. Verify the event signature using the raw body
        event = stripe.webhooks.constructEvent(request.rawBody, sig, webhookSecret);
        console.log(`Webhook received: ${event.id}, Type: ${event.type}`);
    }
    catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    // 2. Handle the event based on its type
    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                console.log(`Processing checkout.session.completed for session ${session.id}`);
                // Check if it's a subscription setup
                if (session.mode === "subscription" &&
                    session.subscription &&
                    session.customer &&
                    ((_a = session.metadata) === null || _a === void 0 ? void 0 : _a.firebaseUID)) {
                    const subscriptionId = session.subscription;
                    const customerId = session.customer;
                    const userId = session.metadata.firebaseUID;
                    console.log(`Subscription checkout successful for user ${userId}, Sub ID: ${subscriptionId}, Customer ID: ${customerId}`);
                    // Fetch the subscription details to get current status and period end
                    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                    // Update user document in Firestore
                    const userRef = db.collection("users").doc(userId);
                    await userRef.set({
                        stripeCustomerId: customerId,
                        subscriptionId: subscription.id,
                        subscriptionStatus: subscription.status, // e.g., 'active', 'trialing'
                        subscriptionPeriodEnd: firestore_1.Timestamp.fromMillis(subscription.current_period_end * 1000),
                    }, { merge: true });
                    console.log(`Updated Firestore user ${userId}`);
                }
                else {
                    console.log(`Skipping checkout session ${session.id} ` +
                        `(mode: ${session.mode}, metadata: ${JSON.stringify(session.metadata)})`);
                }
                break;
            } // Close case block scope
            case "customer.subscription.updated": {
                const subscriptionUpdated = event.data.object;
                console.log(`Processing customer.subscription.updated for subscription ${subscriptionUpdated.id}`);
                if ((_b = subscriptionUpdated.metadata) === null || _b === void 0 ? void 0 : _b.firebaseUID) {
                    const userId = subscriptionUpdated.metadata.firebaseUID;
                    const userRef = db.collection("users").doc(userId);
                    await userRef.update({
                        subscriptionStatus: subscriptionUpdated.status, // e.g., 'active', 'past_due', 'canceled'
                        subscriptionPeriodEnd: firestore_1.Timestamp.fromMillis(subscriptionUpdated.current_period_end * 1000),
                    });
                    console.log(`Updated subscription status to ${subscriptionUpdated.status} for user ${userId}`);
                }
                else {
                    console.warn(`Subscription ${subscriptionUpdated.id} updated, but no firebaseUID found in metadata.`);
                }
                break;
            } // Close case block scope
            case "customer.subscription.deleted": {
                const subscriptionDeleted = event.data.object;
                console.log(`Processing customer.subscription.deleted for subscription ${subscriptionDeleted.id}`);
                if ((_c = subscriptionDeleted.metadata) === null || _c === void 0 ? void 0 : _c.firebaseUID) {
                    const userId = subscriptionDeleted.metadata.firebaseUID;
                    const userRef = db.collection("users").doc(userId);
                    await userRef.update({
                        subscriptionStatus: subscriptionDeleted.status, // Typically 'canceled'
                        subscriptionId: null,
                        subscriptionPeriodEnd: null,
                    });
                    console.log(`Updated subscription status to ${subscriptionDeleted.status} (deleted) for user ${userId}`);
                }
                else {
                    console.warn(`Subscription ${subscriptionDeleted.id} deleted, but no firebaseUID found in metadata.`);
                }
                break;
            } // Close case block scope
            // Add other event types you want to handle (e.g., invoice.payment_failed)
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        // 3. Return a 200 response to acknowledge receipt of the event
        response.status(200).send({ received: true });
    }
    catch (error) {
        console.error("Error processing webhook event:", error);
        // Inform Stripe an error occurred, so it can retry (for transient errors)
        response.status(500).send({ error: `Webhook handler failed: ${error.message}` });
    }
});
//# sourceMappingURL=stripe.js.map