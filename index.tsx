import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  const el = document.createElement('div');
  el.style.cssText = 'color:#fff;background:#000;padding:16px;font-family:monospace;';
  el.textContent = 'BOOT ERROR: ' + (error instanceof Error ? error.message : String(error));
  rootElement.appendChild(el);
  console.error(error);
}
