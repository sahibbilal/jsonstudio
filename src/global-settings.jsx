import React from 'react';
import ReactDOM from 'react-dom/client';
import GlobalSettings from './components/GlobalSettings';
import './main.css';

// Initialize global settings on all pages
function initGlobalSettings() {
  // Check if settings container already exists
  let container = document.getElementById('global-settings-root');
  
  // If not, create it
  if (!container) {
    container = document.createElement('div');
    container.id = 'global-settings-root';
    document.body.appendChild(container);
  }
  
  // Render GlobalSettings
  const root = ReactDOM.createRoot(container);
  root.render(<GlobalSettings />);
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGlobalSettings);
} else {
  initGlobalSettings();
}

