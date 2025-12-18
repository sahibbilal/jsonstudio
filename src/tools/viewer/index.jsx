import React from 'react';
import ReactDOM from 'react-dom/client';
import JSONViewer from './JSONViewer';
import '../../main.css';

document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('json-viewer-root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<JSONViewer />);
  }
});

