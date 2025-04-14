import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';

const VALID_SPORT_TYPES = ['Padel', 'Tennis', 'Running', 'Soccer', 'Basketball', 'Cycling'];

async function updateEventsSportType() {
  try {
    const eventsRef = collection(db, 'events');
    const snapshot = await getDocs(eventsRef);
    
    console.log(`Found ${snapshot.size} events to update`);
    
    for (const docSnapshot of snapshot.docs) {
      const eventData = docSnapshot.data();
      // If the event already has a valid sport type, keep it
      const currentSportType = eventData.sportType;
      const newSportType = VALID_SPORT_TYPES.includes(currentSportType) ? currentSportType : 'Padel';
      
      await updateDoc(doc(db, 'events', docSnapshot.id), {
        sportType: newSportType
      });
      console.log(`Updated event ${docSnapshot.id} with sport type: ${newSportType}`);
    }
    
    console.log('All events updated successfully');
  } catch (error) {
    console.error('Error updating events:', error);
  }
}

updateEventsSportType(); 