import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';

export const EmailVerificationBanner: React.FC = () => {
  const { user } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user || user.emailVerified) {
    return null;
  }

  const handleResendVerification = async () => {
    setIsSending(true);
    setError('');
    setSuccess(false);

    try {
      await sendEmailVerification(auth.currentUser!);
      setSuccess(true);
    } catch (error: any) {
      setError('Failed to send verification email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#2A2A2A] text-white py-3 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm">
            Please verify your email address to access all features.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-400">Verification email sent!</p>}
          <button
            onClick={handleResendVerification}
            disabled={isSending}
            className="text-sm bg-[#C1FF2F] text-black px-4 py-2 rounded-lg hover:bg-[#B1EF1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : 'Resend Verification Email'}
          </button>
        </div>
      </div>
    </div>
  );
}; 