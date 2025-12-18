import React from 'react';
import ReactDOM from 'react-dom/client';
import JSONSchemaGenerator from './JSONSchemaGenerator';
import '../../main.css';

function initSchemaGenerator() {
  const rootElement = document.getElementById('json-schema-generator-root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<JSONSchemaGenerator />);
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSchemaGenerator);
} else {
  initSchemaGenerator();
}

