require('dotenv').config();
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;

console.log('API Key:', apiKey ? 'Found' : 'Missing');
console.log('From Email:', fromEmail);

sgMail.setApiKey(apiKey);

const sendTestEventEmail = async () => {
  try {
    // Sample event data
    const event = {
      id: 'test-event-123',
      title: 'Evening Padel Session',
      date: '2024-04-15',
      time: '19:00',
      location: 'Padel Club Helsinki',
      players: ['player1', 'player2'],
      maxPlayers: 4,
      sportType: 'Padel'
    };

    const msg = {
      to: 'info@weteamup.app',
      from: fromEmail,
      subject: `Your event "${event.title}" has been created!`,
      text: `Your event "${event.title}" has been successfully created. It will take place on ${event.date} at ${event.time} at ${event.location}.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1E1E1E; color: #FFFFFF; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <img src="https://weteamup.app/logo.png" alt="WeTeamUp" style="height: 40px; width: auto;" />
          </div>
          
          <h2 style="color: #C1FF2F; font-size: 24px; margin-bottom: 24px;">Event Created Successfully!</h2>
          <p style="color: #FFFFFF; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Your event has been created and is ready to go:</p>
          
          <div style="background-color: #2A2A2A; padding: 24px; border-radius: 12px; margin: 24px 0;">
            <h3 style="color: #C1FF2F; font-size: 20px; margin: 0 0 16px 0;">${event.title}</h3>
            <div style="color: #FFFFFF; font-size: 16px; line-height: 1.6;">
              <p style="margin: 8px 0;"><strong style="color: #C1FF2F;">Date:</strong> ${event.date}</p>
              <p style="margin: 8px 0;"><strong style="color: #C1FF2F;">Time:</strong> ${event.time}</p>
              <p style="margin: 8px 0;"><strong style="color: #C1FF2F;">Location:</strong> ${event.location}</p>
              <p style="margin: 8px 0;"><strong style="color: #C1FF2F;">Players:</strong> ${event.players.length}/${event.maxPlayers}</p>
              <p style="margin: 8px 0;"><strong style="color: #C1FF2F;">Sport:</strong> ${event.sportType}</p>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="https://weteamup.app/events/${event.id}" style="display: inline-block; background-color: #C1FF2F; color: #000000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Event</a>
          </div>

          <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid #2A2A2A; text-align: center; color: #666666; font-size: 14px;">
            <p>© 2024 WeTeamUp. All rights reserved.</p>
          </div>
        </div>
      `
    };

    console.log('Sending test event creation email to:', msg.to);
    const result = await sgMail.send(msg);
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Error sending email:', error.response?.body?.errors || error);
  }
};

sendTestEventEmail(); 