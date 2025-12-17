import React from 'react';
import ReactDOM from 'react-dom/client';
import JSONConverter from './JSONConverter';
import '../../main.css';

const rootElement = document.getElementById('json-converter-root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<JSONConverter />);
}

