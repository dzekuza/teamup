import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../services/verificationService';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setError('Invalid verification link');
        return;
      }

      try {
        await verifyEmail(token);
        setStatus('success');
        // Redirect to home page after 3 seconds
        setTimeout(() => navigate('/'), 3000);
      } catch (error: any) {
        setStatus('error');
        setError(error.message || 'Verification failed');
      }
    };

    verify();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#1E1E1E] rounded-xl p-8 text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin h-12 w-12 border-4 border-[#C1FF2F] border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Verifying your email...</h2>
            <p className="text-gray-400">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <svg className="h-12 w-12 text-[#C1FF2F] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-gray-400">Your email has been successfully verified. Redirecting you to the home page...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 bg-[#C1FF2F] text-black px-6 py-2 rounded-lg font-medium hover:bg-[#B1EF1F] transition-colors"
            >
              Return to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}; 