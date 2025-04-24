import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp, 
  getDoc,
  addDoc,
  writeBatch
} from 'firebase/firestore';

export const createEventGroupChat = async (eventId: string, eventTitle: string, creatorId: string) => {
  try {
    const batch = writeBatch(db);
    const chatRef = doc(db, 'chats', `event_${eventId}`);

    // First check if chat already exists
    const chatDoc = await getDoc(chatRef);
    if (chatDoc.exists()) {
      console.log('Chat already exists for event:', eventId);
      return chatRef.id;
    }

    // Prepare chat document data
    const chatData = {
      type: 'event_group',
      eventId,
      eventTitle,
      participants: [creatorId],
      lastMessage: 'Event chat created',
      lastMessageTime: serverTimestamp(),
      lastMessageSender: 'system',
      unreadCount: {},
      createdAt: serverTimestamp(),
      createdBy: creatorId
    };

    // Set chat document
    batch.set(chatRef, chatData);

    // Create welcome message in messages subcollection
    const messagesRef = doc(collection(db, 'chats', `event_${eventId}`, 'messages'));
    const messageData = {
      text: `Welcome to the group chat for "${eventTitle}"!`,
      sender: 'system',
      timestamp: serverTimestamp(),
      type: 'system'
    };

    batch.set(messagesRef, messageData);

    // Commit the batch
    await batch.commit();
    console.log('Successfully created chat for event:', eventId);
    return chatRef.id;
  } catch (error) {
    console.error('Error creating event group chat:', error);
    // Don't throw the error to prevent blocking event creation
    return null;
  }
};

export const addUserToEventChat = async (eventId: string, userId: string) => {
  try {
    const chatRef = doc(db, 'chats', `event_${eventId}`);
    
    // Check if chat exists
    const chatDoc = await getDoc(chatRef);
    if (!chatDoc.exists()) {
      console.error('Chat does not exist for event:', eventId);
      return;
    }

    // Check if user is already in the chat
    const chatData = chatDoc.data();
    if (chatData.participants.includes(userId)) {
      console.log('User already in chat:', userId);
      return;
    }

    const batch = writeBatch(db);
    
    // Add user to participants array
    batch.update(chatRef, {
      participants: arrayUnion(userId)
    });

    // Add system message about new participant
    const messagesRef = doc(collection(db, 'chats', `event_${eventId}`, 'messages'));
    batch.set(messagesRef, {
      text: `A new participant has joined the chat`,
      sender: 'system',
      timestamp: serverTimestamp(),
      type: 'system'
    });

    // Commit the batch
    await batch.commit();
    console.log('Successfully added user to chat:', userId);
  } catch (error) {
    console.error('Error adding user to event chat:', error);
    // Don't throw the error to prevent blocking join operation
    return null;
  }
}; 