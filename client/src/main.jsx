import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { IssuesProvider } from './context/IssuesContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <IssuesProvider>
          <App />
        </IssuesProvider>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);
