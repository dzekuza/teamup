const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Initialize Firebase Admin SDK
function initializeFirebase() {
  try {
    const serviceAccountPath = path.resolve(__dirname, '../config/serviceAccount.json');
    const serviceAccount = require(serviceAccountPath);
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
      });
    }
    
    console.log('Firebase Admin SDK initialized successfully');
    return admin.firestore();
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    process.exit(1);
  }
}

module.exports = { initializeFirebase }; 