import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const email = process.argv[2]?.trim().toLowerCase();

if (!raw || !email) {
  console.error('Usage: FIREBASE_SERVICE_ACCOUNT_JSON=... node scripts/provision-admin.mjs admin@example.com');
  process.exit(1);
}

const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(JSON.parse(raw)) });
const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
if (!user.emailVerified) {
  console.error('Admin accounts must have a verified email address.');
  process.exit(1);
}

const configPath = fileURLToPath(new URL('../firebase-applet-config.json', import.meta.url));
const clientConfig = JSON.parse(readFileSync(path.resolve(configPath), 'utf8'));
const databaseId = process.env.FIRESTORE_DATABASE_ID || clientConfig.firestoreDatabaseId || '(default)';
const adminDb = getFirestore(app, databaseId);
await adminDb.collection('admins').doc(user.uid).set({
  email: user.email,
  active: true,
  provisionedAt: FieldValue.serverTimestamp(),
});

console.log('Verified admin access provisioned.');
