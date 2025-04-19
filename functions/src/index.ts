import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK (do this only once)
admin.initializeApp();

// Import other function groups
import * as authFunctions from "./auth";
import * as emailFunctions from "./email";
import * as stripeFunctions from "./stripe"; // Import the new Stripe functions

// Export all functions from the imported files
export const createUserAccount = authFunctions.createUserAccount;
export const sendEventInvitationEmail = emailFunctions.sendEventInvitationEmail;
export const sendEventCreationEmail = emailFunctions.sendEventCreationEmail;
export const sendWelcomeEmail = emailFunctions.sendWelcomeEmail;
export const createStripeCheckoutSession = stripeFunctions.createStripeCheckoutSession; // Export Stripe checkout function
export const stripeWebhook = stripeFunctions.stripeWebhook; // Export Stripe webhook handler 