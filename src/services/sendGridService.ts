const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const emailWrapper = (content: string) => `
  <div style="background-color: #1E1E1E; color: white; padding: 20px; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto;">
      <img src="https://weteamup.app/logo.png" alt="WeTeamUp" style="height: 40px; width: auto; margin-bottom: 20px;" />
      ${content}
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; color: #666; font-size: 12px;">
        © ${new Date().getFullYear()} WeTeamUp. All rights reserved.
      </div>
    </div>
  </div>
`;

export const sendWelcomeEmail = async (to: string, name: string) => {
  const subject = 'Welcome to WeTeamUp!';
  const text = `Welcome to WeTeamUp, ${name}! We're excited to have you join our community.`;
  const html = emailWrapper(`
    <h1 style="color: #C1FF2F;">Welcome to WeTeamUp!</h1>
    <p>Hi ${name},</p>
    <p>We're excited to have you join our community!</p>
    <a href="https://weteamup.app" style="background-color: #C1FF2F; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">Get Started</a>
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
  const subject = 'New Player Joined Your Event on WeTeamUp';
  const text = `${playerName} has joined your event "${eventTitle}" on WeTeamUp.`;
  const html = emailWrapper(`
    <h1 style="color: #C1FF2F;">New Player Joined</h1>
    <p>${playerName} has joined your event:</p>
    <div style="background-color: #2A2A2A; padding: 15px; border-radius: 5px; margin: 15px 0;">
      <p><strong>Event:</strong> ${eventTitle}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p><strong>Location:</strong> ${location}</p>
    </div>
    <a href="https://weteamup.app" style="background-color: #C1FF2F; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">View Event</a>
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
  const subject = `Event Update: ${eventTitle}`;
  const text = `Update for your event "${eventTitle}": ${message}`;
  const html = emailWrapper(`
    <h1 style="color: #C1FF2F; font-size: 24px; margin-bottom: 20px;">Event Update</h1>
    <p style="margin-bottom: 20px;">There's an update for your event "${eventTitle}":</p>
    <div style="background-color: #2A2A2A; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <p>${message}</p>
    </div>
    <a href="https://weteamup.app" style="display: inline-block; background-color: #C1FF2F; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Event</a>
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
  const verificationUrl = `https://weteamup.app/verify-email?token=${verificationToken}`;
  
  const subject = 'Verify your WeTeamUp email address';
  const text = `Hi ${name}, please verify your email address by clicking this link: ${verificationUrl}`;
  const html = emailWrapper(`
    <h1 style="color: #C1FF2F; font-size: 24px; margin-bottom: 20px;">Verify Your Email</h1>
    <p style="margin-bottom: 20px;">Hi ${name},</p>
    <p style="margin-bottom: 20px;">Thanks for signing up for WeTeamUp! Please verify your email address to access all features.</p>
    <div style="text-align: center;">
      <a href="${verificationUrl}" 
         style="display: inline-block; background-color: #C1FF2F; color: black; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
        Verify Email Address
      </a>
    </div>
    <p style="margin-top: 20px; font-size: 14px; color: #666;">
      If you didn't create an account with WeTeamUp, you can safely ignore this email.
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
  const subject = 'New Event Created on WeTeamUp';
  const text = `A new event "${event.title}" has been created on WeTeamUp.`;
  const html = emailWrapper(`
    <h1 style="color: #C1FF2F;">New Event Created</h1>
    <p>The following event has been created:</p>
    <div style="background-color: #2A2A2A; padding: 15px; border-radius: 5px; margin: 15px 0;">
      <p><strong>Event:</strong> ${event.title}</p>
      <p><strong>Date:</strong> ${event.date}</p>
      <p><strong>Time:</strong> ${event.time}</p>
      <p><strong>Location:</strong> ${event.location}</p>
    </div>
    <a href="https://weteamup.app" style="background-color: #C1FF2F; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">View Event</a>
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