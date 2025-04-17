import React, { useState, useEffect } from 'react';
import { useCookieContext } from '../contexts/CookieContext';

interface CookieConsentBannerProps {
  position?: 'top' | 'bottom';
  showPrivacyPolicy?: boolean;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  position = 'bottom',
  showPrivacyPolicy = true
}) => {
  const { preferences, setPreferences } = useCookieContext();
  const [showBanner, setShowBanner] = useState(false);
  
  // Check if user has already made a cookie consent choice
  useEffect(() => {
    // If no cookie consent preference is set, show the banner
    if (!preferences || !preferences.cookieConsent) {
      // Small delay to prevent banner from showing immediately on page load
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [preferences]);
  
  // Handle user consent
  const handleConsent = (hasConsented: boolean) => {
    setPreferences({
      ...preferences,
      cookieConsent: {
        essential: true, // Essential cookies are always required
        functional: hasConsented,
        analytics: hasConsented,
        advertising: hasConsented,
        consentDate: new Date().toISOString()
      }
    });
    
    setShowBanner(false);
  };
  
  if (!showBanner) {
    return null;
  }
  
  return (
    <div 
      className={`fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-50 p-4 bg-[#121212] bg-opacity-95 backdrop-blur-sm shadow-xl transform transition-transform duration-300 ${showBanner ? 'translate-y-0' : position === 'top' ? '-translate-y-full' : 'translate-y-full'}`}
    >
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-white max-w-3xl">
            <h3 className="text-lg font-semibold mb-2">We use cookies</h3>
            <p className="text-sm text-gray-300">
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. We also share information about your use of our site with our analytics partners.
            </p>
            {showPrivacyPolicy && (
              <a 
                href="/privacy-policy" 
                className="text-[#C1FF2F] text-sm mt-1 inline-block hover:underline"
              >
                Read our privacy policy
              </a>
            )}
          </div>
          
          <div className="flex flex-col xs:flex-row gap-3 mt-4 md:mt-0">
            <button
              onClick={() => handleConsent(false)}
              className="px-5 py-2 bg-[#2A2A2A] text-white rounded-xl hover:bg-[#3A3A3A] transition-colors text-sm"
            >
              Decline
            </button>
            <button
              onClick={() => handleConsent(true)}
              className="px-5 py-2 bg-[#C1FF2F] text-black rounded-xl font-medium hover:bg-[#B1EF1F] transition-colors text-sm"
            >
              Accept all cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentBanner; 