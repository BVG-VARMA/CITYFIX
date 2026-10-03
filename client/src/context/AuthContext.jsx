import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { translations } from '../utils/translations';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cityfix_token') || null);
  const [language, setLanguageState] = useState(localStorage.getItem('cityfix_lang') || 'en');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Translation helper
  const t = useCallback((key) => {
    const langDict = translations[language] || translations['en'];
    return langDict[key] || translations['en'][key] || key;
  }, [language]);

  const setLanguage = (lang) => {
    localStorage.setItem('cityfix_lang', lang);
    setLanguageState(lang);
  };

  // Check stored user token if exists (no automatic guest auto-login)
  useEffect(() => {
    async function checkExistingAuth() {
      try {
        if (token) {
          const data = await api.getMe();
          setUser(data.user);
          setUnreadCount(data.unreadNotificationsCount || 0);
          const notifs = await api.getNotifications();
          setNotifications(notifs);
        } else {
          setUser(null);
          setNotifications([]);
        }
      } catch (err) {
        console.warn('Session expired or invalid token');
        localStorage.removeItem('cityfix_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkExistingAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('cityfix_token', res.token);
    setToken(res.token);
    setUser(res.user);
    const notifs = await api.getNotifications();
    setNotifications(notifs);
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    localStorage.setItem('cityfix_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const updateProfile = async (profileData) => {
    const res = await api.updateProfile(profileData);
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('cityfix_token');
    setToken(null);
    setUser(null);
    setNotifications([]);
  };

  const addNotification = (notif) => {
    setNotifications(prev => [notif, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        role: user?.role || 'guest',
        isAdmin: user?.role === 'admin',
        language,
        setLanguage,
        t,
        loading,
        login,
        register,
        updateProfile,
        logout,
        notifications,
        unreadCount,
        addNotification,
        markAllRead,
        refreshNotifications: async () => {
          if (token) {
            const notifs = await api.getNotifications();
            setNotifications(notifs);
          }
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
