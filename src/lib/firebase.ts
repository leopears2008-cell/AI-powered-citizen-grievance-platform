import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// The checked-in Firebase web config does not define a named Firestore database.
// Use the default database explicitly rather than bypassing TypeScript with a cast.
export const db = getFirestore(app);
export const auth = getAuth(app);
