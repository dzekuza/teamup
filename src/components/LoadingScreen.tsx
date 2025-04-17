import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#121212]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-[#C1FF2F] mb-4"></div>
      <p className="text-gray-300 text-lg">Loading...</p>
    </div>
  );
};

export default LoadingScreen; 