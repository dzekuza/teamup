import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const defaultCenter = {
  lat: 54.687157, // Vilnius center
  lng: 25.279652
};

interface PadelLocation {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

const PADEL_LOCATIONS: PadelLocation[] = [
  {
    name: 'Padel Vilnius',
    address: 'Liepkalnio g. 2C, Vilnius 02105',
    coordinates: { lat: 54.6667, lng: 25.2833 }
  },
  {
    name: 'Ozo Padel & Tennis',
    address: 'Ozo g. 14C, Vilnius 08200',
    coordinates: { lat: 54.7167, lng: 25.2833 }
  },
  {
    name: 'SET Padel Club',
    address: 'Kareivių g. 14, Vilnius 09117',
    coordinates: { lat: 54.7000, lng: 25.3000 }
  },
  {
    name: 'Tennis Pro Academy Padel',
    address: 'Naugarduko g. 76, Vilnius 03202',
    coordinates: { lat: 54.6750, lng: 25.2500 }
  },
  {
    name: 'GO9 Padel',
    address: 'Gedimino pr. 9, Vilnius 01103',
    coordinates: { lat: 54.6872, lng: 25.2797 }
  },
  {
    name: 'Padel House Vilnius',
    address: 'Žygio g. 97A, Vilnius 08234',
    coordinates: { lat: 54.7167, lng: 25.2667 }
  },
  {
    name: 'LTU Padel Club',
    address: 'Viršuliškių g. 40, Vilnius 05131',
    coordinates: { lat: 54.7083, lng: 25.2333 }
  }
];

export const migrateEvents = async () => {
  const eventsRef = collection(db, 'events');
  const snapshot = await getDocs(eventsRef);

  for (const docSnapshot of snapshot.docs) {
    const eventData = docSnapshot.data();
    
    // Skip if already migrated
    if (eventData.coordinates && eventData.locationName && eventData.address) {
      continue;
    }

    // Try to find matching location
    const location = PADEL_LOCATIONS.find(loc => 
      eventData.location?.includes(loc.name) || 
      eventData.location?.includes(loc.address)
    );

    if (location) {
      await updateDoc(doc(db, 'events', docSnapshot.id), {
        locationName: location.name,
        address: location.address,
        coordinates: location.coordinates
      });
    } else if (eventData.location) {
      // For custom locations, split by ' - ' if possible
      const [locationName, address] = eventData.location.split(' - ');
      await updateDoc(doc(db, 'events', docSnapshot.id), {
        locationName: address ? locationName : eventData.location,
        address: address || eventData.location,
        coordinates: { lat: defaultCenter.lat, lng: defaultCenter.lng } // Default to Vilnius center
      });
    }
  }
}; 