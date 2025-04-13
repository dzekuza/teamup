import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Event } from '../types';

interface EmailData {
  to: string;
  message: {
    subject: string;
    text?: string;
    html?: string;
  };
}

export const sendEmail = async (emailData: EmailData) => {
  try {
    // Add a document to the 'mail' collection
    const mailRef = collection(db, 'mail');
    await addDoc(mailRef, {
      to: emailData.to,
      message: {
        subject: emailData.message.subject,
        text: emailData.message.text,
        html: emailData.message.html
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

export const sendEventCreationEmail = async (event: Event, userEmail: string) => {
  const eventDate = new Date(event.date).toLocaleDateString();
  
  const emailData: EmailData = {
    to: userEmail,
    message: {
      subject: `New Event Created: ${event.title}`,
      html: `
        <h2>Your event has been created successfully!</h2>
        <h3>Event Details:</h3>
        <ul>
          <li><strong>Title:</strong> ${event.title}</li>
          <li><strong>Date:</strong> ${eventDate}</li>
          <li><strong>Time:</strong> ${event.time} - ${event.endTime}</li>
          <li><strong>Location:</strong> ${event.location}</li>
          <li><strong>Level:</strong> ${event.level}</li>
          <li><strong>Players:</strong> ${event.players.length}/${event.maxPlayers}</li>
          <li><strong>Price:</strong> $${event.price}</li>
          <li><strong>Status:</strong> ${event.status}</li>
        </ul>
        <p>You can view and manage your event by visiting the event page.</p>
      `
    }
  };

  return sendEmail(emailData);
};

// Example usage:
// await sendEmail({
//   to: 'recipient@example.com',
//   message: {
//     subject: 'Test Email',
//     text: 'This is a test email',
//     html: '<h1>This is a test email</h1>'
//   }
// }); 