import { supabase } from '../lib/supabase';

// Email sending via Supabase Edge Function or Vercel API route
const API_URL = process.env.REACT_APP_API_URL || '/api';

interface SendEmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const sendEmail = async (params: SendEmailParams) => {
  try {
    const response = await fetch(`${API_URL}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
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
  return sendEmail({
    to,
    subject: 'New Event Created on TeamUp',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1E1E1E; color: white;">
        <h1 style="color: #C1FF2F;">New Event Created</h1>
        <p>The following event has been created:</p>
        <div style="background-color: #2A2A2A; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Event:</strong> ${event.title}</p>
          <p><strong>Date:</strong> ${event.date}</p>
          <p><strong>Time:</strong> ${event.time}</p>
          <p><strong>Location:</strong> ${event.location}</p>
        </div>
        <a href="${window.location.origin}/event/${event.id}" style="background-color: #C1FF2F; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">View Event</a>
      </div>
    `,
  });
};

export const sendEventInvitation = async (
  to: string,
  eventTitle: string,
  date: string,
  time: string,
  location: string,
  playerName: string
) => {
  return sendEmail({
    to,
    subject: 'New Player Joined Your Event on TeamUp',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1E1E1E; color: white;">
        <h1 style="color: #C1FF2F;">New Player Joined</h1>
        <p>${playerName} has joined your event:</p>
        <div style="background-color: #2A2A2A; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Event:</strong> ${eventTitle}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>
        <a href="${window.location.origin}" style="background-color: #C1FF2F; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px;">View Event</a>
      </div>
    `,
  });
};

export const sendEventUpdate = async (to: string, eventTitle: string, message: string) => {
  return sendEmail({
    to,
    subject: `Event Update: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1E1E1E; color: white;">
        <h1 style="color: #C1FF2F;">Event Update</h1>
        <p>There's an update for your event "${eventTitle}":</p>
        <div style="background-color: #2A2A2A; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p>${message}</p>
        </div>
        <a href="${window.location.origin}" style="background-color: #C1FF2F; color: black; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Event</a>
      </div>
    `,
  });
};

export const sendVerificationEmail = async (to: string, name: string, _verificationToken: string) => {
  // Supabase Auth handles email verification natively
  // This is a no-op since Supabase sends verification emails automatically
  console.log(`Verification email handled by Supabase Auth for ${to}`);
  return true;
};
