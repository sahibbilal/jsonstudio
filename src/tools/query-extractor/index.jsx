import React from 'react';
import ReactDOM from 'react-dom/client';
import JSONQueryExtractor from './JSONQueryExtractor';
import '../../main.css';

function initQueryExtractor() {
  const rootElement = document.getElementById('json-query-extractor-root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<JSONQueryExtractor />);
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQueryExtractor);
} else {
  initQueryExtractor();
}

