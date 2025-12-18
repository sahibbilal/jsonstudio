import React from 'react';
import ReactDOM from 'react-dom/client';
import JSONValidator from './JSONValidator';
import '../../main.css';

document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('json-validator-root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<JSONValidator />);
  }
});

