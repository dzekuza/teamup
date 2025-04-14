import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
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
    // Use Firestore Send Email extension
    const emailDoc = {
      to: emailData.to,
      message: {
        subject: emailData.message.subject,
        html: emailData.message.html || '',
        text: emailData.message.text || ''
      }
    };

    // Add to the mail collection which triggers the Firestore Send Email extension
    await addDoc(collection(db, 'mail'), emailDoc);
    
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

export const sendEventInvitation = async (
  recipientEmail: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  eventLocation: string,
  creatorName: string
) => {
  const subject = `You're invited to a padel event: ${eventTitle}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #C1FF2F;">You're invited to a padel event!</h2>
      <p>Hello,</p>
      <p>${creatorName} has invited you to join a padel event:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${eventTitle}</h3>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Time:</strong> ${eventTime}</p>
        <p><strong>Location:</strong> ${eventLocation}</p>
      </div>
      
      <p>Log in to your account to view the event details and join the game!</p>
      
      <div style="margin-top: 30px; font-size: 12px; color: #777;">
        <p>This email was sent from WebPadel. If you have any questions, please contact the event creator.</p>
      </div>
    </div>
  `;
  
  const text = `
    You're invited to a padel event!
    
    Hello,
    
    ${creatorName} has invited you to join a padel event:
    
    ${eventTitle}
    Date: ${eventDate}
    Time: ${eventTime}
    Location: ${eventLocation}
    
    Log in to your account to view the event details and join the game!
    
    This email was sent from WebPadel. If you have any questions, please contact the event creator.
  `;
  
  return sendEmail({
    to: recipientEmail,
    message: {
      subject,
      html,
      text
    }
  });
};

export const sendEventUpdate = async (
  recipientEmail: string,
  eventTitle: string,
  updateMessage: string
) => {
  const subject = `Update for padel event: ${eventTitle}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #C1FF2F;">Event Update</h2>
      <p>Hello,</p>
      <p>The following padel event has been updated:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${eventTitle}</h3>
        <p>${updateMessage}</p>
      </div>
      
      <p>Log in to your account to view the updated event details.</p>
      
      <div style="margin-top: 30px; font-size: 12px; color: #777;">
        <p>This email was sent from WebPadel. If you have any questions, please contact the event creator.</p>
      </div>
    </div>
  `;
  
  const text = `
    Event Update
    
    Hello,
    
    The following padel event has been updated:
    
    ${eventTitle}
    ${updateMessage}
    
    Log in to your account to view the updated event details.
    
    This email was sent from WebPadel. If you have any questions, please contact the event creator.
  `;
  
  return sendEmail({
    to: recipientEmail,
    message: {
      subject,
      html,
      text
    }
  });
};

export const sendPlayerJoinedNotification = async (
  recipientEmail: string,
  eventTitle: string,
  playerName: string
) => {
  const subject = `New player joined: ${eventTitle}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #C1FF2F;">New Player Joined</h2>
      <p>Hello,</p>
      <p>A new player has joined your padel event:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${eventTitle}</h3>
        <p><strong>New Player:</strong> ${playerName}</p>
      </div>
      
      <p>Log in to your account to view the updated player list.</p>
      
      <div style="margin-top: 30px; font-size: 12px; color: #777;">
        <p>This email was sent from WebPadel. If you have any questions, please contact the event creator.</p>
      </div>
    </div>
  `;
  
  const text = `
    New Player Joined
    
    Hello,
    
    A new player has joined your padel event:
    
    ${eventTitle}
    New Player: ${playerName}
    
    Log in to your account to view the updated player list.
    
    This email was sent from WebPadel. If you have any questions, please contact the event creator.
  `;
  
  return sendEmail({
    to: recipientEmail,
    message: {
      subject,
      html,
      text
    }
  });
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