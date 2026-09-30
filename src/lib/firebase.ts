import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfigDefaults from '../../firebase-applet-config.json';

// Firebase web configuration is public client configuration (never place Admin
// SDK credentials or private keys in VITE_ variables).
const firebaseConfig = {
  ...firebaseConfigDefaults,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigDefaults.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigDefaults.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigDefaults.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigDefaults.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigDefaults.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigDefaults.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIRESTORE_DATABASE_ID || firebaseConfigDefaults.firestoreDatabaseId,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);
