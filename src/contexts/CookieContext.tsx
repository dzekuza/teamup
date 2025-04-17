import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthCookie, usePreferencesCookie } from '../hooks/useCookies';

// Define the context type
interface CookieContextType {
  // Auth related
  userData: any;
  setUserData: (value: object, options?: any) => void;
  removeUserData: () => void;
  isAuthenticated: boolean;
  
  // Preferences related
  preferences: any;
  setPreferences: (value: object, options?: any) => void;
  resetPreferences: () => void;
}

// Create the context with a default value
const CookieContext = createContext<CookieContextType | undefined>(undefined);

// Props for the provider
interface CookieProviderProps {
  children: ReactNode;
}

/**
 * Provider component for cookies context
 */
export const CookieProvider: React.FC<CookieProviderProps> = ({ children }) => {
  // Auth cookies
  const { 
    userData, 
    setUserData, 
    removeUserData, 
    isAuthenticated 
  } = useAuthCookie();
  
  // Preferences cookies
  const { 
    preferences, 
    setPreferences, 
    resetPreferences 
  } = usePreferencesCookie();
  
  // Create the context value
  const contextValue: CookieContextType = {
    userData,
    setUserData,
    removeUserData,
    isAuthenticated,
    preferences,
    setPreferences, 
    resetPreferences
  };
  
  return (
    <CookieContext.Provider value={contextValue}>
      {children}
    </CookieContext.Provider>
  );
};

/**
 * Custom hook to use the cookie context
 */
export const useCookieContext = (): CookieContextType => {
  const context = useContext(CookieContext);
  
  if (context === undefined) {
    throw new Error('useCookieContext must be used within a CookieProvider');
  }
  
  return context;
};

export default CookieContext; 