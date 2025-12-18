import React from 'react';
import ReactDOM from 'react-dom/client';
import JSONMockDataGenerator from './JSONMockDataGenerator';
import '../../main.css';

function initMockDataGenerator() {
  const rootElement = document.getElementById('json-mock-data-generator-root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<JSONMockDataGenerator />);
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMockDataGenerator);
} else {
  initMockDataGenerator();
}

