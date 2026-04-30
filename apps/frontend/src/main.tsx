import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ClerkProvider } from '@clerk/clerk-react';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from './lib/ThemeContext';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <ClerkProvider
         publishableKey={PUBLISHABLE_KEY}
         afterSignOutUrl="/"
         appearance={{ layout: { unsafe_disableDevelopmentModeWarnings: true } }}
        >
          <App />
        </ClerkProvider>
      </ThemeProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
