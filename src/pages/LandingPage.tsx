import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import phoneMockup from '../assets/phonemock.png';
import LogoWhite from '../assets/images/logo-white.svg';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#121212] grid md:grid-cols-2">
      {/* Left Column - Content */}
      <div className="flex flex-col items-start justify-center p-8 md:p-16">
        <img src={LogoWhite} alt="Logo" className="h-12 mb-12 md:mb-16" />
        
        <div className="w-full max-w-md space-y-8 pl-0">
          <div>
            <h1 className="text-4xl font-bold text-white mb-3">
              Create an account or login
            </h1>
            <p className="text-gray-400 text-lg">
              Enter your email address or create a new account
            </p>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-[#C1FF2F] text-black rounded-lg p-4 font-medium hover:bg-[#B1EF1F] transition-colors flex items-center justify-center gap-2"
          >
            Join now
            <ArrowRightIcon className="h-5 w-5" />
          </button>

          <p className="text-center">
            <span className="text-gray-400">Don't have an account? </span>
            <button 
              onClick={() => navigate('/register')}
              className="text-[#C1FF2F] hover:underline font-medium"
            >
              Create new
            </button>
          </p>
        </div>
      </div>

      {/* Right Column - Phone Mockup */}
      <div className="hidden md:flex items-center justify-center bg-[#CDEA68] relative p-16">
        <img
          src={"https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/iMockup%20-%20iPhone%2015%20Pro%20Max-1.png?alt=media&token=060a25f0-cc84-4960-987b-b3bc03605a4a"}
          alt="App preview"
          className="w-full h-auto object-contain max-h-[80vh]"
        />
      </div>
    </div>
  );
};

export default LandingPage; 