const fetch = require('node-fetch');

const testDirectEmail = async () => {
  try {
    console.log('Sending test email directly to server endpoint...');
    
    const response = await fetch('http://localhost:3001/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'info@weteamup.app',
        subject: 'Direct Test Email',
        text: 'This is a test email sent directly to the server endpoint.',
        html: `
          <div style="background-color: #1E1E1E; color: white; padding: 20px; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto;">
              <h1 style="color: #C1FF2F;">Direct Test Email</h1>
              <p>This is a test email sent directly to the server endpoint.</p>
              <p>If you're seeing this, the server-side email service is working!</p>
            </div>
          </div>
        `
      })
    });

    const result = await response.json();
    console.log('Server response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};

testDirectEmail(); 