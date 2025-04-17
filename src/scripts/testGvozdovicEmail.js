import fetch from 'node-fetch';

const testGvozdovicEmail = async () => {
  try {
    console.log('Sending test email to info@gvozdovic.com...');
    
    const response = await fetch('http://localhost:3001/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'info@gvozdovic.com',
        subject: 'Test Email from WebPadel',
        text: 'This is a test email from the WebPadel application.',
        html: `
          <div style="background-color: #1E1E1E; color: white; padding: 20px; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto;">
              <h1 style="color: #C1FF2F; font-size: 24px; margin-bottom: 20px;">WebPadel Test Email</h1>
              <p style="margin-bottom: 20px;">This is a test email sent to verify the email notification functionality for info@gvozdovic.com.</p>
              <p style="margin-bottom: 20px;">If you're seeing this, the email service is working correctly!</p>
            </div>
          </div>
        `
      })
    });

    const result = await response.json();
    console.log('Server response:', result);
    
    if (response.ok) {
      console.log('Test email sent successfully!');
    } else {
      console.error('Failed to send test email:', result.error);
    }
  } catch (error) {
    console.error('Error sending test email:', error);
  }
};

testGvozdovicEmail(); 