import React, { FormEvent, useState } from 'react';
import { LockKeyhole, ShieldCheck, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AdminLogin: React.FC = () => {
  const { login, resetAdminPassword, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      showToast('Enter the admin email and password.', 'warning');
      return;
    }
    setBusy(true);
    try {
      await login(email, password);
      showToast('Admin authentication successful.', 'success');
    } catch {
      showToast('Unable to sign in with those credentials or this account is not authorized.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="max-w-md mx-auto py-12" aria-labelledby="admin-login-title">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h1 id="admin-login-title" className="text-xl font-bold text-slate-900">Admin dashboard</h1>
            <p className="text-sm text-slate-500">Authorized staff only</p>
          </div>
        </div>

        <div className="mb-5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <p>Citizen accounts cannot access this dashboard. Admin access is checked against the protected Firebase admin registry.</p>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="admin-email" className="block text-sm font-semibold text-slate-800 mb-1.5">Admin email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              required
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-semibold text-slate-800 mb-1.5">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              required
            />
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                await resetAdminPassword(email);
              } catch {
                // Deliberately use the same response for unknown accounts to reduce enumeration.
              }
              showToast('If the account exists, a password-reset email has been requested.', 'info');
            }}
            className="text-xs font-semibold text-indigo-700 hover:underline"
          >
            Forgot password?
          </button>

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold px-4 py-2.5 text-sm"
          >
            <LockKeyhole className="w-4 h-4" aria-hidden="true" />
            {busy ? 'Signing in…' : 'Sign in to admin'}
          </button>
        </form>
      </div>
    </section>
  );
};
