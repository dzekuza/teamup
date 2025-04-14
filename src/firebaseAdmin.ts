import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
  });
}

// Export db instance
export const db = admin.firestore();
export default admin; 