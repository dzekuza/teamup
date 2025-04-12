import React from 'react';

interface SuccessMessageProps {
  title: string;
  message: string;
  shareUrl?: string;
  onClose: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  title,
  message,
  shareUrl,
  onClose,
}) => {
  const handleCopyLink = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1E1E1E] rounded-3xl p-8 w-full max-w-md relative">
        <h2 className="text-2xl font-medium text-white mb-4 text-center">
          {title}
        </h2>
        
        <p className="text-gray-300 text-center mb-6">
          {message}
        </p>

        {shareUrl && (
          <div className="mb-6">
            <div className="flex items-center gap-2 bg-[#2A2A2A] rounded-xl p-3">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-white text-sm focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1 bg-[#C1FF2F] text-black text-sm rounded-lg hover:bg-[#B1EF1F] transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#C1FF2F] text-black rounded-xl font-medium hover:bg-[#B1EF1F] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}; 