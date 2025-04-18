import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';

interface AccessContextProps {
  isAccessGranted: boolean;
  grantAccess: () => void;
}

const AccessContext = createContext<AccessContextProps | undefined>(undefined);

interface AccessProviderProps {
  children: ReactNode;
}

const ACCESS_KEY = 'hasValidAccessCode';

export const AccessProvider: React.FC<AccessProviderProps> = ({ children }) => {
  const [isAccessGranted, setIsAccessGranted] = useState<boolean>(false);

  useEffect(() => {
    // Check sessionStorage on initial load
    const hasAccess = sessionStorage.getItem(ACCESS_KEY) === 'true';
    setIsAccessGranted(hasAccess);
  }, []);

  const grantAccess = useCallback(() => {
    sessionStorage.setItem(ACCESS_KEY, 'true');
    setIsAccessGranted(true);
  }, []);

  return (
    <AccessContext.Provider value={{ isAccessGranted, grantAccess }}>
      {children}
    </AccessContext.Provider>
  );
};

export const useAccess = (): AccessContextProps => {
  const context = useContext(AccessContext);
  if (context === undefined) {
    throw new Error('useAccess must be used within an AccessProvider');
  }
  return context;
}; 