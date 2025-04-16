// Script to update all events with status 'upcoming' to 'active'
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from:', envPath);
  dotenv.config({ path: envPath });
} else {
  console.log('No .env file found, using process.env');
  dotenv.config();
}

// Firebase configuration
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
const db = getFirestore(app);

async function updateEventStatus() {
  try {
    console.log('Starting event status update...');
    console.log('Firebase config:', JSON.stringify({
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain
    }));
    
    const eventsRef = collection(db, 'events');
    const snapshot = await getDocs(eventsRef);
    
    let updatedCount = 0;
    let totalCount = 0;
    
    console.log(`Found ${snapshot.docs.length} events in total`);
    
    for (const docSnapshot of snapshot.docs) {
      totalCount++;
      const eventData = docSnapshot.data();
      
      // Log the event data for debugging
      console.log(`Event ID: ${docSnapshot.id}, Current Status: ${eventData.status}`);
      
      // Check if the status is 'upcoming' or anything other than 'active'/'completed'
      if (eventData.status === 'upcoming' || 
          !(eventData.status === 'active' || eventData.status === 'completed')) {
        await updateDoc(doc(db, 'events', docSnapshot.id), {
          status: 'active'
        });
        updatedCount++;
        console.log(`Updated event ${docSnapshot.id} status to 'active'`);
      }
    }
    
    console.log(`Update complete. Updated ${updatedCount} out of ${totalCount} events.`);
  } catch (error) {
    console.error('Error updating events:', error);
  }
}

// Run the update
updateEventStatus(); 