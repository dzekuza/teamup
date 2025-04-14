interface EventDetails {
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  description?: string;
}

export const addToAppleWallet = async (eventDetails: EventDetails) => {
  try {
    // Format the dates according to Apple's requirements
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    // Create the .ics file content
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${eventDetails.title}
DTSTART:${formatDate(eventDetails.startDate)}
DTEND:${formatDate(eventDetails.endDate)}
LOCATION:${eventDetails.location}
DESCRIPTION:${eventDetails.description || ''}
END:VEVENT
END:VCALENDAR`;

    // Create a Blob with the .ics content
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);

    // Create a link element and trigger the download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${eventDetails.title.replace(/\s+/g, '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error creating Apple Wallet pass:', error);
    return false;
  }
}; 