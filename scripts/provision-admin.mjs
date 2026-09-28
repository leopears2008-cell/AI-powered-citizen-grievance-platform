import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const email = process.argv[2]?.trim().toLowerCase();

if (!raw || !email) {
  console.error('Usage: FIREBASE_SERVICE_ACCOUNT_JSON=... node scripts/provision-admin.mjs admin@example.com');
  process.exit(1);
}

const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(JSON.parse(raw)) });
const auth = getAuth(app);
const db = getFirestore(app);
const user = await auth.getUserByEmail(email);

await db.collection('admins').doc(user.uid).set({
  email: user.email,
  active: true,
  provisionedAt: FieldValue.serverTimestamp(),
});

console.log(`Admin access provisioned for ${user.email} (${user.uid}).`);