import React from 'react'
import ReactDOM from 'react-dom/client'
import WorkTracker from './WorkTracker.jsx'

// Shim for window.storage — your component uses window.storage.get/set
// This wraps localStorage so it works in a normal browser.
if (!window.storage) {
  window.storage = {
    async get(key) {
      const value = localStorage.getItem(key);
      return value !== null ? { value } : null;
    },
    async set(key, value) {
      localStorage.setItem(key, value);
    },
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WorkTracker />
  </React.StrictMode>
)
