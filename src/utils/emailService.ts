import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Sends an email using the Firestore Send Email extension
 * @param to Recipient email address
 * @param subject Email subject
 * @param html HTML content of the email
 * @param text Plain text content of the email (optional)
 * @param cc CC recipients (optional)
 * @param bcc BCC recipients (optional)
 * @param replyTo Reply-to email address (optional)
 * @param categories Email categories for tracking (optional)
 */
export const sendEmail = async (
  to: string | string[],
  subject: string,
  html: string,
  text?: string,
  cc?: string | string[],
  bcc?: string | string[],
  replyTo?: string,
  categories?: string[]
) => {
  try {
    // Create the email document
    const emailData: any = {
      to,
      message: {
        subject,
        html,
      },
    };

    // Add optional fields if provided
    if (text) emailData.message.text = text;
    if (cc) emailData.cc = cc;
    if (bcc) emailData.bcc = bcc;
    if (replyTo) emailData.replyTo = replyTo;
    if (categories) emailData.categories = categories;

    // Add the document to the mail collection
    await addDoc(collection(db, 'mail'), emailData);
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

/**
 * Sends an event invitation email
 * @param recipientEmail Recipient email address
 * @param eventTitle Event title
 * @param eventDate Event date
 * @param eventTime Event time
 * @param eventLocation Event location
 * @param creatorName Name of the event creator
 */
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
  
  return sendEmail(recipientEmail, subject, html, text);
};

/**
 * Sends an event update notification
 * @param recipientEmail Recipient email address
 * @param eventTitle Event title
 * @param updateMessage Message describing the update
 */
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
  
  return sendEmail(recipientEmail, subject, html, text);
};

/**
 * Sends a player joined notification
 * @param recipientEmail Recipient email address
 * @param eventTitle Event title
 * @param playerName Name of the player who joined
 */
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
  
  return sendEmail(recipientEmail, subject, html, text);
}; 