import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { UserRole, NotificationItem } from '../types';
import { translations } from '../locales/translations';
import { api } from '../services/api';
import { auth } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  reload,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type AppLanguage = 'en' | 'ta';
export type AppTab = 'home' | 'file' | 'track' | 'history' | 'admin' | 'analytics' | 'directory' | 'privacy' | 'terms' | 'cookies';

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AppContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: typeof translations.en;
  role: UserRole;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  trackId: string;
  setTrackId: (id: string) => void;
  navigateToTrack: (id: string) => void;
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  toasts: ToastInfo[];
  showToast: (message: string, type?: ToastInfo['type']) => void;
  removeToast: (id: string) => void;
  user: User | null;
  isAdmin: boolean;
  authLoading: boolean;
  isCitizenVerified: boolean;
  refreshAuthenticatedUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  resetAdminPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [trackId, setTrackId] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const syncedSessions = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setAuthLoading(true);
      setUser(nextUser);
      setIsAdmin(false);

      if (!nextUser) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error('Anonymous citizen session could not be created:', error instanceof Error ? error.name : 'unknown');
        } finally {
          setAuthLoading(false);
        }
        return;
      }

      try {
        const adminSnap = await getDoc(doc(db, 'admins', nextUser.uid));
        const admin = nextUser.emailVerified && adminSnap.exists() && adminSnap.data()?.active === true;
        setIsAdmin(admin);
      } catch (error) {
        console.error('Unable to verify admin role:', error instanceof Error ? error.name : 'unknown');
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const adminSnap = await getDoc(doc(db, 'admins', credential.user.uid));
    if (!credential.user.emailVerified || !adminSnap.exists() || adminSnap.data()?.active !== true) {
      await signOut(auth);
      throw new Error('This account is not verified or is not authorized for the admin dashboard.');
    }
    setIsAdmin(true);
    setActiveTab('admin');
  };

  const logout = async () => {
    await signOut(auth);
    setIsAdmin(false);
    setActiveTab('home');
  };

  const resetAdminPassword = async (email: string) => {
    if (!email.trim()) throw new Error('Enter your admin email first.');
    await sendPasswordResetEmail(auth, email.trim());
  };

  const t = translations[language] || translations.en;
  const role: UserRole = isAdmin ? 'ADMIN' : 'CITIZEN';
  const isCitizenVerified = Boolean(user && !user.isAnonymous && (user.emailVerified || user.phoneNumber));
  const refreshAuthenticatedUser = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    await reload(currentUser);
    await currentUser.getIdToken(true);
    setUser(auth.currentUser);
  };
  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  // Record the verified citizen profile and verification audit events once per
  // uid/language. The server derives everything from the verified ID token, so
  // nothing here can be used to claim a verification the user does not have.
  useEffect(() => {
    if (!user || !isCitizenVerified) return;
    const key = `${user.uid}:${language}`;
    if (syncedSessions.current.has(key)) return;
    syncedSessions.current.add(key);
    void api.syncSession(language);
  }, [user, isCitizenVerified, language]);

  const showToast = (message: string, type: ToastInfo['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => removeToast(id), 4500);
  };

  const removeToast = (id: string) => setToasts((prev) => prev.filter((toast) => toast.id !== id));

  const navigateToTrack = (id: string) => {
    setTrackId(id);
    setActiveTab('track');
  };

  useEffect(() => {
    if (!isAdmin) {
      setNotifications([]);
      return;
    }
    api.getNotifications().then(setNotifications).catch(() => setNotifications([]));
  }, [isAdmin, refreshKey]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await api.markNotificationRead(id).catch(() => {});
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider value={{
      language, setLanguage, t, role, activeTab, setActiveTab,
      trackId, setTrackId, navigateToTrack, notifications, unreadCount,
      markAsRead, refreshKey, triggerRefresh, toasts, showToast, removeToast,
      user, isAdmin, authLoading, isCitizenVerified, refreshAuthenticatedUser, login, resetAdminPassword, logout,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
