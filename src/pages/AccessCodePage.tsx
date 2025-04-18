import React, { useState } from 'react';
import { useAccess } from '../contexts/AccessContext'; // Import the hook
import LogoWhite from '../assets/images/logo-white.svg'; // Reuse logo

// !!! IMPORTANT: Replace this with a secure code, ideally from environment variables !!!
const CORRECT_ACCESS_CODE = 'letsteamup';

const AccessCodePage: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const { grantAccess } = useAccess(); // Get the grantAccess function

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous error

    if (code === CORRECT_ACCESS_CODE) {
      grantAccess(); // Call grantAccess if code is correct
      // No navigation needed here, AppContent will re-render
    } else {
      setError('Invalid access code. Please try again.');
      setCode(''); // Clear input on error
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-4">
      <img src={LogoWhite} alt="WebPadel" className="h-12 w-auto mb-8" />
      <div className="bg-[#1E1E1E] p-8 rounded-lg shadow-xl max-w-sm w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Enter Access Code</h1>
        <p className="text-gray-400 text-sm text-center mb-6">
          Please enter the access code provided to you to proceed.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="access-code" className="sr-only">Access Code</label>
            <input
              id="access-code"
              type="password" // Use password type to hide input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Access Code"
              required
              className="w-full bg-[#2A2A2A] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#C1FF2F] placeholder-gray-500"
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-[#C1FF2F] text-black rounded-lg px-6 py-3 font-medium hover:bg-[#B1EF1F] transition-colors"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccessCodePage; 