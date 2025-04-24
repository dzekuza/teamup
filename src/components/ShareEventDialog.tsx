import React, { useState, useEffect, useRef } from 'react';
import { addToAppleWallet } from '../utils/appleWallet';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';

interface ShareEventDialogProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventDetails: {
    title: string;
    date: string;
    time: string;
    location: string;
  };
}

export const ShareEventDialog: React.FC<ShareEventDialogProps> = ({
  open,
  onClose,
  eventId,
  eventDetails
}) => {
  const shareUrl = `${window.location.origin}/event/${eventId}`;
  const [isVisible, setIsVisible] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Show/hide animation logic
  useEffect(() => {
    if (open) {
      setIsVisible(true);
      setShowQR(false);
    } else {
      // Add a delay to allow the animation to complete before hiding
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle touch start event
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
    setTouchEnd(null);
  };
  
  // Handle touch move event
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };
  
  // Handle touch end event to determine swipe direction
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    // Determine distance of swipe
    const distance = touchEnd - touchStart;
    
    // If distance is greater than 100px, consider it a swipe down
    if (distance > 100) {
      onClose();
    }
    
    // Reset touch values
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Join me for ${eventDetails.title}`);
    const body = encodeURIComponent(
      `Hey,\n\nI'd like to invite you to join me for ${eventDetails.title} on ${eventDetails.date} at ${eventDetails.time}, ${eventDetails.location}.\n\nYou can view the event details and join here: ${shareUrl}\n\nHope to see you there!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const toggleQRCode = () => {
    setShowQR(!showQR);
  };

  const handleAddToCalendar = () => {
    try {
      // Parse date and time
      const [year, month, day] = eventDetails.date.split('-').map(Number);
      const [startHour, startMinute] = eventDetails.time.split(':').map(Number);

      // Create start date (subtract 1 from month as JavaScript months are 0-based)
      const startDate = new Date(year, month - 1, day, startHour, startMinute);
      
      // Create end date (1 hour after start)
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      // Format dates for Google Calendar (YYYYMMDDTHHmmssZ format)
      const formatDate = (date: Date) => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00Z`;
      };

      const dates = `${formatDate(startDate)}/${formatDate(endDate)}`;

      // Create Google Calendar URL
      const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventDetails.title)}&dates=${dates}&location=${encodeURIComponent(eventDetails.location)}&details=${encodeURIComponent(`Join us for a padel game at ${eventDetails.location}. Click here to view event details: ${shareUrl}`)}`;

      // Open in new tab
      window.open(googleCalendarUrl, '_blank');
    } catch (error) {
      console.error('Error creating calendar event:', error);
    }
  };

  const handleAddToAppleWallet = async () => {
    try {
      const [startHour, startMinute] = eventDetails.time.split(':').map(Number);
      const startDate = new Date(eventDetails.date);
      startDate.setHours(startHour, startMinute);

      const success = await addToAppleWallet({
        title: eventDetails.title,
        startDate,
        endDate: new Date(startDate.getTime() + 60 * 60 * 1000), // 1 hour duration
        location: eventDetails.location,
        description: `Join us for a padel game at ${eventDetails.location}`
      });

      if (success) {
        console.log('Event added to Apple Wallet');
      }
    } catch (error) {
      console.error('Error adding to Apple Wallet:', error);
    }
  };

  // Share dialog content component that will be reused between mobile and desktop
  const ShareContent = () => (
    <>
      <h2 className="text-2xl font-medium text-white mb-4 text-center">
        Share Event
      </h2>
      
      {showQR ? (
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white p-4 rounded-lg mb-4">
            <QRCodeSVG value={shareUrl} size={200} />
          </div>
          <p className="text-gray-300 text-sm mb-4 text-center">Scan this QR code to access the event</p>
          <button
            onClick={toggleQRCode}
            className="px-6 py-2 bg-[#2A2A2A] text-white rounded-xl font-medium hover:bg-[#3A3A3A] transition-colors"
          >
            Back to Sharing Options
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center gap-2 bg-[#2A2A2A] rounded-xl p-3 mb-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-white text-sm focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1 ${copied ? 'bg-green-500' : 'bg-[#C1FF2F]'} text-black text-sm rounded-lg transition-colors`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={handleEmailShare}
              className="px-4 py-3 bg-[#2A2A2A] text-white rounded-xl font-medium hover:bg-[#3A3A3A] transition-colors flex flex-col items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Email</span>
            </button>
            
            <button
              onClick={handleFacebookShare}
              className="px-4 py-3 bg-[#1877F2] text-white rounded-xl font-medium hover:bg-[#166FE5] transition-colors flex flex-col items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9.19795 21.5H13.198V13.4901H16.8021L17.198 9.50977H13.198V7.5C13.198 6.94772 13.6457 6.5 14.198 6.5H17.198V2.5H14.198C11.4365 2.5 9.19795 4.73858 9.19795 7.5V9.50977H7.19795L6.80206 13.4901H9.19795V21.5Z" />
              </svg>
              <span>Facebook</span>
            </button>
            
            <button
              onClick={toggleQRCode}
              className="px-4 py-3 bg-[#2A2A2A] text-white rounded-xl font-medium hover:bg-[#3A3A3A] transition-colors flex flex-col items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>QR Code</span>
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-3 bg-[#C1FF2F] text-black rounded-xl font-medium hover:bg-[#B1EF1F] transition-colors flex flex-col items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Done</span>
            </button>
          </div>
        </>
      )}
    </>
  );

  return (
    <>
      {/* Mobile bottom sheet dialog */}
      <div 
        className={`md:hidden fixed inset-0 z-50 ${isVisible ? 'block' : 'hidden'}`}
        style={{ 
          backgroundColor: '#121212', 
          transition: 'opacity 0.3s ease',
          opacity: open ? 1 : 0
        }}
        onClick={onClose}
      >
        <div 
          className={`fixed inset-x-0 bottom-0 z-50 bg-[#1E1E1E] rounded-t-xl max-h-[90vh] overflow-auto transform transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-full flex justify-center py-2">
            <div className="w-10 h-1 bg-gray-500 rounded-full"></div>
          </div>
          <div className="p-8">
            <ShareContent />
          </div>
        </div>
      </div>

      {/* Desktop modal dialog */}
      <div 
        className={`hidden fixed inset-0 z-50 flex items-center justify-center p-4 ${isVisible ? 'block' : 'hidden'}`}
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.7)', 
          transition: 'opacity 0.3s ease',
          opacity: open ? 1 : 0
        }}
        onClick={onClose}
      >
        <div 
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#1E1E1E] rounded-xl max-w-md w-full max-h-[90vh] overflow-auto shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            <ShareContent />
          </div>
        </div>
      </div>
    </>
  );
}; 