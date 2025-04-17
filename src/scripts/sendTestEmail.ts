import { sendTestEmail } from '../utils/testEmail';

// The email address to send the test email to
const TEST_EMAIL = 'info@gvozdovic.com';

async function main() {
  console.log(`Sending test email to ${TEST_EMAIL}...`);
  
  try {
    const result = await sendTestEmail(TEST_EMAIL);
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
}

// Execute the main function
main(); 