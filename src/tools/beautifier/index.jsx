import React from 'react';
import { createRoot } from 'react-dom/client';
import JSONBeautifier from './JSONBeautifier';
import '../../main.css';

// Initialize React app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('json-beautifier-root');
  if (container) {
    const root = createRoot(container);
    root.render(<JSONBeautifier />);
  }
});

