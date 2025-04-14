require('dotenv').config();
const sgMail = require('@sendgrid/mail');

const SENDGRID_API_KEY = process.env.REACT_APP_SENDGRID_API_KEY;
const SENDER_EMAIL = process.env.REACT_APP_SENDER_EMAIL;

console.log('API Key found:', !!SENDGRID_API_KEY);
console.log('Sender email:', SENDER_EMAIL);

sgMail.setApiKey(SENDGRID_API_KEY);

const msg = {
  to: 'info@weteamup.app',
  from: SENDER_EMAIL,
  subject: 'Test Email from WeTeamUp',
  text: 'This is a test email to verify SendGrid integration.',
  html: `
    <div style="background-color: #1E1E1E; color: white; padding: 20px; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto;">
        <h1 style="color: #C1FF2F; font-size: 24px; margin-bottom: 20px;">Test Email</h1>
        <p style="margin-bottom: 20px;">This is a test email to verify that SendGrid integration is working correctly.</p>
        <p style="margin-bottom: 20px;">If you're seeing this, the email service is configured properly!</p>
      </div>
    </div>
  `
};

sgMail.send(msg)
  .then(response => {
    console.log('Email sent successfully:', response);
  })
  .catch(error => {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error('Error response:', error.response.body);
    }
  }); 