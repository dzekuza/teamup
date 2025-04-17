import { sendEmail } from '../services/emailService';

/**
 * Sends a test email to verify email functionality
 * @param toEmail The recipient email address
 */
export const sendTestEmail = async (toEmail: string) => {
  try {
    const result = await sendEmail({
      to: toEmail,
      message: {
        subject: 'WebPadel - Test Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #C1FF2F;">Email System Test</h2>
            <p>Hello,</p>
            <p>This is a test email to verify that the WebPadel email notification system is working correctly.</p>
            <p>If you're receiving this email, the system is functioning as expected!</p>
            <div style="margin-top: 30px; font-size: 12px; color: #777;">
              <p>This email was sent from WebPadel as a test. No action is required.</p>
            </div>
          </div>
        `,
        text: `
          Email System Test
          
          Hello,
          
          This is a test email to verify that the WebPadel email notification system is working correctly.
          
          If you're receiving this email, the system is functioning as expected!
          
          This email was sent from WebPadel as a test. No action is required.
        `
      }
    });

    console.log('Test email result:', result);
    return result;
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
}; 