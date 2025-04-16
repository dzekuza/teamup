import React, { useState, useEffect } from 'react';
import { addToAppleWallet } from '../utils/appleWallet';

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

  // Show/hide animation logic
  useEffect(() => {
    if (open) {
      setIsVisible(true);
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
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
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

  return (
    <div 
      className={`fixed inset-0 z-50 ${isVisible ? 'block' : 'hidden'}`}
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        transition: 'background-color 0.3s ease, opacity 0.3s ease',
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
          <h2 className="text-2xl font-medium text-white mb-4 text-center">
            Share Event
          </h2>
          
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

          <div className="flex flex-col gap-3">
            <button
              onClick={handleAddToCalendar}
              className="px-6 py-2 bg-[#2A2A2A] text-white rounded-xl font-medium hover:bg-[#3A3A3A] transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Add to Calendar
            </button>
            <button
              onClick={handleAddToAppleWallet}
              className="px-6 py-2 bg-black text-white rounded-xl font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.1,5.8c1.2-1.1,2.7-1.7,4.3-1.7c0.2,1.9-0.5,3.8-1.7,5c-1.2,1.2-2.7,1.7-4.2,1.7C10.3,8.9,11,7,12.1,5.8z M18.4,19.5c-0.9,1.7-1.9,3.2-3.4,3.2c-1.5,0-1.9-0.9-3.6-0.9c-1.7,0-2.2,0.9-3.6,0.9c-1.5,0-2.6-1.6-3.5-3.2c-1.9-2.9-2.1-6.3-0.9-8.1c0.8-1.2,2.2-1.9,3.7-1.9c1.5,0,2.5,0.9,3.7,0.9c1.2,0,1.9-0.9,3.7-0.9c1.3,0,2.7,0.7,3.7,1.9C15.6,13.5,15.9,18.4,18.4,19.5z"/>
              </svg>
              Add to Apple Wallet
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#C1FF2F] text-black rounded-xl font-medium hover:bg-[#B1EF1F] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 