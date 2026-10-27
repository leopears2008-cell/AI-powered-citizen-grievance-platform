/**
 * Login session recorder (Express router factory).
 *
 * NOT wired into server.ts: nothing imports this file, so existing behaviour,
 * build, and type-checking are unchanged. To enable it, add to server.ts:
 *
 *   import { createLoginSessionRouter } from './server/loginSessions.ts';
 *   app.set('trust proxy', 1); // so req.ip is the real client IP behind Railway/Render
 *   app.use('/api/auth/session', createLoginSessionRouter({
 *     supabaseUrl: process.env.SUPABASE_URL ?? '',
 *     supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
 *     firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
 *   }));
 *
 * The frontend must then call, once after each successful Firebase sign-in:
 *   fetch(`${API_URL}/api/auth/session`, {
 *     method: 'POST',
 *     headers: { Authorization: `Bearer ${await user.getIdToken()}` },
 *   });
 *
 * Requires migration supabase/migrations/011_login_sessions.sql.
 * The user id is taken from the verified token, never from the request body,
 * and the IP is req.ip (never a raw X-Forwarded-For header, which is spoofable).
 */
import { Router, type Request, type Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { getApps, initializeApp, cert, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export const MAX_IP_LENGTH = 64;
export const MAX_USER_AGENT_LENGTH = 512;

export interface LoginSessionOptions {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  /** Needed only if firebase-admin has not already been initialised elsewhere. */
  firebaseServiceAccountJson?: string;
  /** Minimum gap between recorded sessions for one user. Default 60s. */
  minIntervalMs?: number;
}

export function extractBearerToken(header: unknown): string | null {
  if (typeof header !== 'string') return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

/** Trims, strips control characters, and caps length. Returns null for empty values. */
export function sanitizeClientField(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength);
  return cleaned.length > 0 ? cleaned : null;
}

function resolveFirebaseApp(serviceAccountJson?: string): App {
  const existing = getApps()[0];
  if (existing) return existing;
  if (!serviceAccountJson) {
    throw new Error('Login session recorder needs FIREBASE_SERVICE_ACCOUNT_JSON.');
  }
  return initializeApp({ credential: cert(JSON.parse(serviceAccountJson) as ServiceAccount) });
}

export function createLoginSessionRouter(options: LoginSessionOptions): Router {
  const { supabaseUrl, supabaseServiceRoleKey, firebaseServiceAccountJson, minIntervalMs = 60_000 } = options;
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Login session recorder requires Supabase server credentials.');
  }

  const auth = getAuth(resolveFirebaseApp(firebaseServiceAccountJson));
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Per-instance throttle so a client loop cannot flood the table.
  const lastRecorded = new Map<string, number>();

  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    let uid: string;
    try {
      uid = (await auth.verifyIdToken(token)).uid;
    } catch {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const now = Date.now();
    const previous = lastRecorded.get(uid);
    if (previous !== undefined && now - previous < minIntervalMs) {
      res.status(204).end(); // already recorded moments ago; treat as success
      return;
    }

    try {
      const { error } = await supabase.from('login_sessions').insert({
        user_id: uid,
        ip_address: sanitizeClientField(req.ip, MAX_IP_LENGTH),
        user_agent: sanitizeClientField(req.headers['user-agent'], MAX_USER_AGENT_LENGTH),
      });
      if (error) throw error;

      lastRecorded.set(uid, now);
      if (lastRecorded.size > 10_000) {
        for (const [key, time] of lastRecorded) if (now - time >= minIntervalMs) lastRecorded.delete(key);
      }
      res.status(204).end();
    } catch (err) {
      console.error('[login-sessions] insert failed:', err instanceof Error ? err.message : err);
      res.status(500).json({ error: 'Could not record session.' });
    }
  });

  return router;
}
