import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Event } from '../types';

interface WhatsAppMessage {
  from: string;
  body: string;
  timestamp: string;
}

// Example message format:
// Create event: Padel Evening
// Date: 2024-04-15
// Time: 18:00
// Location: Padel Center Stockholm
// Level: Intermediate
// Price: 150
// Max Players: 4

export const parseWhatsAppMessage = (message: string): Partial<Event> | null => {
  try {
    const lines = message.split('\n');
    const eventData: Partial<Event> = {
      createdAt: new Date().toISOString(),
    };

    lines.forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      
      switch (key.toLowerCase()) {
        case 'create event':
          eventData.title = value;
          break;
        case 'date':
          eventData.date = value;
          break;
        case 'time':
          eventData.time = value;
          break;
        case 'location':
          eventData.location = value;
          break;
        case 'level':
          eventData.level = value;
          break;
        case 'price':
          eventData.price = parseInt(value);
          break;
        case 'max players':
          eventData.maxPlayers = parseInt(value);
          break;
      }
    });

    // Validate required fields
    if (!eventData.title || !eventData.date || !eventData.time || !eventData.location) {
      return null;
    }

    // Set default values
    eventData.currentPlayers = 0;
    eventData.players = [];

    return eventData;
  } catch (error) {
    console.error('Error parsing WhatsApp message:', error);
    return null;
  }
};

export const handleWhatsAppMessage = async (message: WhatsAppMessage) => {
  const eventData = parseWhatsAppMessage(message.body);
  
  if (!eventData) {
    return {
      success: false,
      message: 'Invalid event format. Please use the correct format:\nCreate event: [title]\nDate: YYYY-MM-DD\nTime: HH:MM\nLocation: [location]\nLevel: [Beginner/Intermediate/Advanced]\nPrice: [amount]\nMax Players: [number]'
    };
  }

  try {
    // Add the event to Firestore
    const eventsRef = collection(db, 'events');
    const docRef = await addDoc(eventsRef, {
      ...eventData,
      createdBy: message.from
    });

    return {
      success: true,
      message: `Event "${eventData.title}" created successfully! Event ID: ${docRef.id}`,
      eventId: docRef.id
    };
  } catch (error) {
    console.error('Error creating event:', error);
    return {
      success: false,
      message: 'Error creating event. Please try again.'
    };
  }
}; 