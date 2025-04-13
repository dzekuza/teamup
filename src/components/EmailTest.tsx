import React, { useState } from 'react';
import { sendEmail } from '../services/emailService';

export const EmailTest: React.FC = () => {
  const [email, setEmail] = useState('nayeli.koepp@ethereal.email');
  const [subject, setSubject] = useState('Test Email from WebPadel');
  const [message, setMessage] = useState('This is a test email from WebPadel application.');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Sending...');

    try {
      const result = await sendEmail({
        to: email,
        message: {
          subject,
          text: message,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1E1E1E; color: white;">
              <h2 style="color: #C1FF2F; margin-bottom: 20px;">WebPadel Test Email</h2>
              <div style="background-color: #2A2A2A; padding: 20px; border-radius: 12px; margin: 20px 0;">
                <p style="margin: 10px 0;">${message}</p>
              </div>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #2A2A2A;">
                <p style="color: #C1FF2F; font-size: 14px;">Sent from WebPadel</p>
              </div>
            </div>
          `
        }
      });

      if (result.success) {
        setStatus('Email sent successfully!');
      } else {
        setStatus('Failed to send email. Check console for details.');
      }
    } catch (error) {
      console.error('Error:', error);
      setStatus('Error sending email. Check console for details.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-[#1E1E1E] rounded-3xl shadow-lg border border-[#2A2A2A]">
      <h2 className="text-2xl font-medium text-white mb-6">Test Email Sending</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">To:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] border-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Subject:</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 block w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] border-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Message:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 block w-full bg-[#2A2A2A] text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] border-none"
            rows={4}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-3 px-4 bg-[#C1FF2F] text-black rounded-xl font-medium hover:bg-[#B1EF1F] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] focus:ring-offset-2 focus:ring-offset-[#1E1E1E]"
        >
          Send Test Email
        </button>
      </form>
      {status && (
        <div className="mt-4 p-4 rounded-xl bg-[#2A2A2A]">
          <p className="text-sm text-gray-300">{status}</p>
        </div>
      )}
    </div>
  );
}; 