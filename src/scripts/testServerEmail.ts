import { sendWelcomeEmail } from '../services/sendGridService';

const testEmail = async () => {
  try {
    console.log('Sending test welcome email...');
    const result = await sendWelcomeEmail('info@weteamup.app', 'Test User');
    console.log('Test email result:', result);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
};

testEmail(); 