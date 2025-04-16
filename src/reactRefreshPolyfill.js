// This file serves as a proxy to the react-refresh runtime
// Import any react-refresh related code here if needed in the future

// Mock for React Refresh
if (process.env.NODE_ENV !== 'production') {
  window.$RefreshReg$ = () => {};
  window.$RefreshSig$ = () => (type) => type;
}

// Export an empty object to satisfy imports
export default {
  // This is just a stub to prevent import errors
};

// Export React Refresh runtime for modules that need it
export const performReactRefresh = () => {
  // No-op function since we're not actually using React Refresh
  console.log('React Refresh polyfill called');
}; 