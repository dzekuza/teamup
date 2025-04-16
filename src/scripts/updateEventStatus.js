// Script to update all events with status 'upcoming' to 'active'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

async function updateEventStatus() {
  try {
    console.log('Starting event status update...');
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
      
      // Check if the status is 'upcoming' or not 'active'/'completed'
      if (eventData.status === 'upcoming' || 
         (eventData.status !== 'active' && eventData.status !== 'completed')) {
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