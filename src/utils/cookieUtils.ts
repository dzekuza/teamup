import Cookies from 'js-cookie';

// Default expiration in days
const DEFAULT_EXPIRATION = 30;

/**
 * Set a cookie with the given name, value and optional options
 * @param name The name of the cookie
 * @param value The value to store in the cookie
 * @param options Optional cookie options (expiration, path, etc.)
 */
export const setCookie = (
  name: string, 
  value: string | object, 
  options?: Cookies.CookieAttributes
): void => {
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
  
  Cookies.set(name, stringValue, {
    expires: DEFAULT_EXPIRATION,
    path: '/',
    sameSite: 'strict',
    ...options
  });
};

/**
 * Get a cookie by name
 * @param name The name of the cookie to retrieve
 * @param parseJson Whether to parse the cookie value as JSON
 * @returns The cookie value or null if not found
 */
export const getCookie = (name: string, parseJson: boolean = false): any => {
  const value = Cookies.get(name);
  
  if (!value) {
    return null;
  }
  
  if (parseJson) {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error(`Error parsing cookie ${name}:`, error);
      return value;
    }
  }
  
  return value;
};

/**
 * Remove a cookie by name
 * @param name The name of the cookie to remove
 * @param options Optional cookie removal options
 */
export const removeCookie = (name: string, options?: Cookies.CookieAttributes): void => {
  Cookies.remove(name, {
    path: '/',
    ...options
  });
};

/**
 * Check if a cookie exists
 * @param name The name of the cookie to check
 * @returns Whether the cookie exists
 */
export const hasCookie = (name: string): boolean => {
  return Cookies.get(name) !== undefined;
};

/**
 * Set user authentication cookie
 * @param token Authentication token
 * @param expiration Expiration time in days
 */
export const setAuthCookie = (token: string, expiration: number = DEFAULT_EXPIRATION): void => {
  setCookie('auth_token', token, { expires: expiration });
};

/**
 * Get the authentication token from cookies
 * @returns The auth token or null if not found
 */
export const getAuthToken = (): string | null => {
  return getCookie('auth_token');
};

/**
 * Remove the authentication cookie
 */
export const removeAuthCookie = (): void => {
  removeCookie('auth_token');
};

/**
 * Set user preferences in a cookie
 * @param preferences User preferences object
 */
export const setUserPreferences = (preferences: object): void => {
  setCookie('user_preferences', preferences);
};

/**
 * Get user preferences from cookie
 * @returns User preferences object or null if not found
 */
export const getUserPreferences = (): object | null => {
  return getCookie('user_preferences', true);
};

/**
 * Clear all cookies set by the application
 */
export const clearAllCookies = (): void => {
  // Get all cookies
  const allCookies = Cookies.get();
  
  // Remove each cookie
  Object.keys(allCookies).forEach(cookie => {
    removeCookie(cookie);
  });
}; 