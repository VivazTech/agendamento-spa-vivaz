
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SupabaseAuthProvider } from './src/contexts/SupabaseAuthContext';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <SupabaseAuthProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SupabaseAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
