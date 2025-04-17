import { useState, useCallback, useEffect } from 'react';
import { setCookie, getCookie, removeCookie, hasCookie } from '../utils/cookieUtils';

/**
 * Custom hook for managing cookies in React components
 * @param key Cookie name
 * @param initialValue Default value if cookie doesn't exist
 * @param parseJSON Whether to parse the cookie value as JSON
 * @returns [cookieValue, setCookieValue, removeCookieValue]
 */
function useCookie<T extends string | object>(
  key: string, 
  initialValue?: T, 
  parseJSON: boolean = false
): [T | null, (value: T, options?: any) => void, () => void] {
  // Get the initial value for the cookie
  const getCookieValue = useCallback(() => {
    const cookie = getCookie(key, parseJSON);
    if (cookie !== null) {
      return cookie as T;
    }
    return initialValue || null;
  }, [key, initialValue, parseJSON]);

  // State to store the cookie value
  const [cookieValue, setCookieValue] = useState<T | null>(getCookieValue);

  // Update the cookie
  const updateCookie = useCallback(
    (value: T, options?: any) => {
      setCookie(key, value, options);
      setCookieValue(value);
    },
    [key]
  );

  // Remove the cookie
  const removeCookieValue = useCallback(() => {
    removeCookie(key);
    setCookieValue(null);
  }, [key]);

  // Sync state with cookie value if it changes externally
  useEffect(() => {
    const newValue = getCookieValue();
    if (JSON.stringify(newValue) !== JSON.stringify(cookieValue)) {
      setCookieValue(newValue);
    }
  }, [getCookieValue, cookieValue]);

  return [cookieValue, updateCookie, removeCookieValue];
}

/**
 * Custom hook for managing user authentication cookies
 * @returns [userData, setUserData, removeUserData, isAuthenticated]
 */
export function useAuthCookie() {
  const [userData, setUserData, removeUserData] = useCookie<object>('userData', {}, true);

  // Check if user is authenticated
  const isAuthenticated = !!userData && Object.keys(userData).length > 0;

  return {
    userData,
    setUserData,
    removeUserData,
    isAuthenticated
  };
}

/**
 * Custom hook for managing user preferences cookies
 * @returns [preferences, setPreferences, resetPreferences]
 */
export function usePreferencesCookie() {
  const [preferences, setPreferences, removePreferences] = useCookie<object>('user_preferences', {}, true);

  // Reset preferences to default
  const resetPreferences = useCallback(() => {
    setPreferences({});
  }, [setPreferences]);

  return {
    preferences,
    setPreferences,
    resetPreferences
  };
}

export default useCookie; 