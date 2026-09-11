import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Route benign TensorFlow Lite / XNNPACK Emscripten stderr INFO messages to console.info
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('INFO: Created TensorFlow Lite') ||
     args[0].includes('INFO: Initialized TensorFlow Lite') ||
     args[0].startsWith('INFO:'))
  ) {
    console.info(...args);
    return;
  }
  originalConsoleError(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
