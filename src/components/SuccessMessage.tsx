import React from 'react';

interface SuccessMessageProps {
  title: string;
  message: string;
  shareUrl?: string;
  onClose: () => void;
  eventDetails?: {
    title: string;
    date: string;
    time: string;
    location: string;
  };
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  title,
  message,
  shareUrl,
  onClose,
  eventDetails
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

  const handleAddToCalendar = () => {
    if (!eventDetails) return;

    try {
      // Parse date and time
      const [year, month, day] = eventDetails.date.split('-').map(Number);
      const [startHour, startMinute] = eventDetails.time.split(' - ')[0].split(':').map(Number);

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
      const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventDetails.title)}&dates=${dates}&location=${encodeURIComponent(eventDetails.location)}&details=${encodeURIComponent(`Join us for a padel game at ${eventDetails.location}. Click here to view event details: ${shareUrl || ''}`)}`;

      // Open in new tab
      window.open(googleCalendarUrl, '_blank');
    } catch (error) {
      console.error('Error creating calendar event:', error);
    }
  };

  const handleAddToAppleCalendar = () => {
    if (!eventDetails) return;

    try {
      const [year, month, day] = eventDetails.date.split('-').map(Number);
      const [startHour, startMinute] = eventDetails.time.split(' - ')[0].split(':').map(Number);
      const [endHour, endMinute] = eventDetails.time.split(' - ')[1].split(':').map(Number);

      // Format dates for .ics (YYYYMMDDTHHmmssZ format, UTC)
      const formatICSDate = (date: Date) => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`;
      };

      const startDate = new Date(Date.UTC(year, month - 1, day, startHour, startMinute));
      // If endTime exists, use it, otherwise assume 1 hour duration
      let endDate: Date | undefined;
      if (endHour !== undefined && endMinute !== undefined) {
        endDate = new Date(Date.UTC(year, month - 1, day, endHour, endMinute));
        // Handle cases where end time is on the next day (simple case for now)
        if (endDate < startDate) {
          endDate.setDate(endDate.getUTCDate() + 1);
        }
      } else {
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour duration
      }
      
      const startTimeICS = formatICSDate(startDate);
      const endTimeICS = formatICSDate(endDate);
      const nowICS = formatICSDate(new Date());
      const uid = `${startTimeICS}-${Math.random().toString(36).substring(2, 15)}@webpadel.app`;

      // Create .ics content
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//WebPadel//Event//EN',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${nowICS}`,
        `DTSTART:${startTimeICS}`,
        `DTEND:${endTimeICS}`,
        `SUMMARY:${eventDetails.title}`,
        `LOCATION:${eventDetails.location}`,
        `DESCRIPTION:Join the event: ${shareUrl || ''}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      // Create a data URI
      const dataUri = `data:text/calendar;charset=utf8,${encodeURIComponent(icsContent)}`;

      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = `${eventDetails.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Error creating Apple Calendar event (.ics):', error);
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

        <div className="flex flex-col gap-3">
          {eventDetails && (
            <div className="flex gap-3">
              <button
                onClick={handleAddToCalendar}
                className="flex-1 px-4 py-2 bg-[#2A2A2A] text-white rounded-xl font-medium hover:bg-[#3A3A3A] transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Add to Calendar
              </button>
              <button
                onClick={handleAddToAppleCalendar}
                className="flex-1 px-4 py-2 bg-black text-white rounded-xl font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Add to Apple Calendar
              </button>
            </div>
          )}
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