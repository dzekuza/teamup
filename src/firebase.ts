import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// Replace these values with the ones from your Firebase Console
// You can find these by:
// 1. Go to Firebase Console (https://console.firebase.google.com)
// 2. Select your project
// 3. Click on the gear icon (Project Settings)
// 4. Scroll down to "Your apps" section
// 5. Under the web app, click "Config"
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and db instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app; 