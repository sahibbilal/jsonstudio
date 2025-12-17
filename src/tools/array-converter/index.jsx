import React from 'react';
import ReactDOM from 'react-dom/client';
import JSONArrayConverter from './JSONArrayConverter';
import '../../main.css';

const rootElement = document.getElementById('json-array-converter-root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<JSONArrayConverter />);
}

