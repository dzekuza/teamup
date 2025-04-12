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
  apiKey: "AIzaSyBD0xxgaYtN6DXuphHDtfgyRE12Xd8Lg38",
  authDomain: "newprojecta-36c09.firebaseapp.com",
  projectId: "newprojecta-36c09",
  storageBucket: "newprojecta-36c09.firebasestorage.app",
  messagingSenderId: "430493779515",
  appId: "1:430493779515:web:d0867ef45a108348bbbe1e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app; 