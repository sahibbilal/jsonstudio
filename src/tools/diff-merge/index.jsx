import React from 'react';
import ReactDOM from 'react-dom/client';
import JSONDiffMerge from './JSONDiffMerge';
import '../../main.css';

document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('json-diff-merge-root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<JSONDiffMerge />);
  }
});

