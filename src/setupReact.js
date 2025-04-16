// This file ensures React is properly initialized
import React from 'react';
import './reactRefreshPolyfill';

// Ensure React is available globally (some libraries expect this)
window.React = React;

export default React; 