import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

// Web Audio API chime synthesizer for crisp real-time civic alerts
function playSoundAlert(type = 'ping') {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'new_issue') {
      // Dual high tone chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.3); // D6

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start(ctx.currentTime + 0.15);
      osc1.stop(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.4);
    } else if (type === 'status_updated') {
      // Harmonious success chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.24); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.36); // C6

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else {
      // Subtle pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (e) {
    // Audio contexts might be blocked until user gesture, ignore safely
  }
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveToast, setLiveToast] = useState(null);
  const { user, addNotification } = useAuth();

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Socket connected to CityFix Gateway:', socketInstance.id);
      setIsConnected(true);

      if (user?.id) {
        socketInstance.emit('join:user', user.id);
      }
      if (user?.role === 'admin') {
        socketInstance.emit('join:admin');
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Update rooms when user changes
  useEffect(() => {
    if (socket && isConnected && user?.id) {
      socket.emit('join:user', user.id);
      if (user.role === 'admin') {
        socket.emit('join:admin');
      }
    }
  }, [user, socket, isConnected]);

  const showToast = useCallback((toastData) => {
    setLiveToast(toastData);
    setTimeout(() => {
      setLiveToast((prev) => (prev?.id === toastData.id ? null : prev));
    }, 5500);
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        liveToast,
        setLiveToast,
        showToast,
        playSoundAlert
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
}
