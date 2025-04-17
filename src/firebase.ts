import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

declare global {
  interface Window {
    FIREBASE_CONFIG?: {
      apiKey: string;
      authDomain: string;
      projectId: string;
      storageBucket: string;
      messagingSenderId: string;
      appId: string;
    };
  }
}

const firebaseConfig = window.FIREBASE_CONFIG || {
  apiKey: "AIzaSyBD0xxgaYtN6DXuphHDtfgyRE12Xd8Lg38",
  authDomain: "newprojecta-36c09.firebaseapp.com",
  projectId: "newprojecta-36c09",
  storageBucket: "newprojecta-36c09.firebasestorage.app",
  messagingSenderId: "430493779515",
  appId: "1:430493779515:web:d459716bd06877f8bbbe1e"
};

// Validate Firebase configuration
const validateConfig = (config: typeof firebaseConfig) => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingFields = requiredFields.filter(field => !config[field as keyof typeof config]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required Firebase configuration fields: ${missingFields.join(', ')}`);
  }
};

try {
  validateConfig(firebaseConfig);
} catch (error) {
  console.error('Firebase configuration error:', error);
  throw error;
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and db instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app; 