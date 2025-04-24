const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emailWrapper = (content: string) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TeamUp</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #121212; color: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="background-color: #121212; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #1A1A1A; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <div style="text-align: center; padding: 32px 20px; background-color: #1E1E1E;">
            <img src="https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/teamup%20lgoo.svg?alt=media&token=fd5b715d-7682-4193-8683-24fd65433d89" 
                 alt="TeamUp" 
                 style="height: 40px; width: auto;" />
          </div>
          
          <!-- Content -->
          <div style="padding: 32px 24px;">
            ${content}
          </div>
          
          <!-- Footer -->
          <div style="padding: 24px; background-color: #1E1E1E; text-align: center;">
            <div style="margin-bottom: 16px;">
              <a href="https://teamup.lt" style="color: #C1FF2F; text-decoration: none; margin: 0 12px;">Home</a>
              <a href="https://teamup.lt/community" style="color: #C1FF2F; text-decoration: none; margin: 0 12px;">Community</a>
              <a href="https://teamup.lt/locations" style="color: #C1FF2F; text-decoration: none; margin: 0 12px;">Venues</a>
            </div>
            <div style="color: #666; font-size: 12px;">
              © ${new Date().getFullYear()} TeamUp. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>
`;

const buttonStyle = 'display: inline-block; background-color: #C1FF2F; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: background-color 0.2s;';
const cardStyle = 'background-color: #2A2A2A; padding: 20px; border-radius: 12px; margin: 20px 0;';
const headingStyle = 'color: #C1FF2F; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;';

export const sendWelcomeEmail = async (to: string, name: string) => {
  const subject = 'Welcome to TeamUp! 🎾';
  const text = `Welcome to TeamUp, ${name}! We're excited to have you join our community.`;
  const html = emailWrapper(`
    <h1 style="${headingStyle}">Welcome to TeamUp!</h1>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Hi ${name},</p>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">We're thrilled to have you join our community of sports enthusiasts! With TeamUp, you can:</p>
    <div style="${cardStyle}">
      <ul style="list-style-type: none; padding: 0; margin: 0;">
        <li style="margin-bottom: 12px; display: flex; align-items: center;">
          <span style="color: #C1FF2F; margin-right: 8px;">✓</span> Find and join sports events near you
        </li>
        <li style="margin-bottom: 12px; display: flex; align-items: center;">
          <span style="color: #C1FF2F; margin-right: 8px;">✓</span> Create your own events and invite others
        </li>
        <li style="margin-bottom: 12px; display: flex; align-items: center;">
          <span style="color: #C1FF2F; margin-right: 8px;">✓</span> Connect with players in your area
        </li>
        <li style="display: flex; align-items: center;">
          <span style="color: #C1FF2F; margin-right: 8px;">✓</span> Track your games and progress
        </li>
      </ul>
    </div>
    <div style="text-align: center;">
      <a href="https://teamup.lt" style="${buttonStyle}">Get Started</a>
    </div>
  `);

  try {
    const response = await fetch(`${API_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, text, html }),
    });

    if (!response.ok) {
      throw new Error('Failed to send welcome email');
    }

    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

export const sendEventInvitation = async (
  to: string,
  eventTitle: string,
  date: string,
  time: string,
  location: string,
  playerName: string
) => {
  const subject = `${playerName} joined your event on TeamUp 🎾`;
  const text = `${playerName} has joined your event "${eventTitle}" on TeamUp.`;
  const html = emailWrapper(`
    <h1 style="${headingStyle}">New Player Joined</h1>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Great news! ${playerName} has joined your event:
    </p>
    <div style="${cardStyle}">
      <div style="margin-bottom: 16px;">
        <div style="color: #888; font-size: 14px; margin-bottom: 4px;">Event</div>
        <div style="font-size: 16px; font-weight: 500;">${eventTitle}</div>
      </div>
      <div style="margin-bottom: 16px;">
        <div style="color: #888; font-size: 14px; margin-bottom: 4px;">Date</div>
        <div style="font-size: 16px;">${date}</div>
      </div>
      <div style="margin-bottom: 16px;">
        <div style="color: #888; font-size: 14px; margin-bottom: 4px;">Time</div>
        <div style="font-size: 16px;">${time}</div>
      </div>
      <div>
        <div style="color: #888; font-size: 14px; margin-bottom: 4px;">Location</div>
        <div style="font-size: 16px;">${location}</div>
      </div>
    </div>
    <div style="text-align: center;">
      <a href="https://teamup.lt" style="${buttonStyle}">View Event</a>
    </div>
  `);

  try {
    const response = await fetch(`${API_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, text, html }),
    });

    if (!response.ok) {
      throw new Error('Failed to send event invitation email');
    }

    return true;
  } catch (error) {
    console.error('Error sending event invitation email:', error);
    return false;
  }
};

export const sendEventUpdate = async (to: string, eventTitle: string, message: string) => {
  const subject = `Event Update: ${eventTitle} 🔔`;
  const text = `Update for your event "${eventTitle}": ${message}`;
  const html = emailWrapper(`
    <h1 style="${headingStyle}">Event Update</h1>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      There's an update for your event "${eventTitle}":
    </p>
    <div style="${cardStyle}">
      <p style="font-size: 16px; line-height: 1.6; margin: 0;">${message}</p>
    </div>
    <div style="text-align: center;">
      <a href="https://teamup.lt" style="${buttonStyle}">View Event</a>
    </div>
  `);

  try {
    const response = await fetch(`${API_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, text, html }),
    });

    if (!response.ok) {
      throw new Error('Failed to send event update email');
    }

    return true;
  } catch (error) {
    console.error('Error sending event update email:', error);
    return false;
  }
};

export const sendVerificationEmail = async (to: string, name: string, verificationToken: string) => {
  const verificationUrl = `https://teamup.lt/verify-email?token=${verificationToken}`;
  
  const subject = 'Verify your TeamUp email address ✉️';
  const text = `Hi ${name}, please verify your email address by clicking this link: ${verificationUrl}`;
  const html = emailWrapper(`
    <h1 style="${headingStyle}">Verify Your Email</h1>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Hi ${name},</p>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Thanks for signing up for TeamUp! To get started, please verify your email address.
    </p>
    <div style="text-align: center;">
      <a href="${verificationUrl}" style="${buttonStyle}">
        Verify Email Address
      </a>
    </div>
    <p style="color: #888; font-size: 14px; line-height: 1.6; margin-top: 24px; text-align: center;">
      If you didn't create an account with TeamUp, you can safely ignore this email.
    </p>
  `);

  try {
    const response = await fetch(`${API_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, text, html }),
    });

    if (!response.ok) {
      throw new Error('Failed to send verification email');
    }

    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

export const sendEventCreationEmail = async (
  to: string,
  event: {
    title: string;
    date: string;
    time: string;
    location: string;
    maxPlayers: number;
    sportType?: string;
    id: string;
  }
) => {
  const subject = 'Your event has been created! 🎾';
  const text = `Your event "${event.title}" has been created on TeamUp.`;
  const html = emailWrapper(`
    <h1 style="${headingStyle}">Event Created Successfully</h1>
    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
      Your event has been created and is now live on TeamUp:
    </p>
    <div style="${cardStyle}">
      <div style="margin-bottom: 16px;">
        <div style="color: #888; font-size: 14px; margin-bottom: 4px;">Event</div>
        <div style="font-size: 16px; font-weight: 500;">${event.title}</div>
      </div>
      <div style="margin-bottom: 16px;">
        <div style="color: #888; font-size: 14px; margin-bottom: 4px;">Date</div>
        <div style="font-size: 16px;">${event.date}</div>
      </div>
      <div style="margin-bottom: 16px;">
        <div style="color: #888; font-size: 14px; margin-bottom: 4px;">Time</div>
        <div style="font-size: 16px;">${event.time}</div>
      </div>
      <div style="margin-bottom: 16px;">
        <div style="color: #888; font-size: 14px; margin-bottom: 4px;">Location</div>
        <div style="font-size: 16px;">${event.location}</div>
      </div>
      <div>
        <div style="color: #888; font-size: 14px; margin-bottom: 4px;">Maximum Players</div>
        <div style="font-size: 16px;">${event.maxPlayers}</div>
      </div>
    </div>
    <div style="text-align: center;">
      <a href="https://teamup.lt/event/${event.id}" style="${buttonStyle}">View Event</a>
    </div>
    <p style="color: #888; font-size: 14px; line-height: 1.6; margin-top: 24px; text-align: center;">
      Share this event with your friends to get more players to join!
    </p>
  `);

  try {
    const response = await fetch(`${API_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, text, html }),
    });

    if (!response.ok) {
      throw new Error('Failed to send event creation email');
    }

    return true;
  } catch (error) {
    console.error('Error sending event creation email:', error);
    return false;
  }
}; 