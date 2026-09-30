import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { createUserWithEmailAndPassword, RecaptchaVerifier, sendEmailVerification, signInWithEmailAndPassword, signInWithPhoneNumber, signOut, updateProfile, type ConfirmationResult } from 'firebase/auth';
import { ArrowLeft, CheckCircle2, Mail, Phone, ShieldCheck } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useApp } from '../context/AppContext';

type Method = 'phone' | 'email';
type EmailMode = 'register' | 'login';

function authMessage(error: unknown, language: 'en' | 'ta') {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  const tamil = language === 'ta';
  const messages: Record<string, [string, string]> = {
    'auth/invalid-phone-number': ['Enter a valid phone number in international format.', 'சரியான சர்வதேச தொலைபேசி எண்ணை உள்ளிடவும்.'],
    'auth/invalid-verification-code': ['That OTP is incorrect. Check it and try again.', 'OTP தவறானது. சரிபார்த்து மீண்டும் முயற்சிக்கவும்.'],
    'auth/code-expired': ['That OTP has expired. Request a new one.', 'OTP காலாவதியானது. புதிய OTP கோரவும்.'],
    'auth/too-many-requests': ['Too many attempts. Wait a while before trying again.', 'பல முயற்சிகள் செய்யப்பட்டன. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'],
    'auth/network-request-failed': ['Network problem. Check your connection and try again.', 'இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.'],
    'auth/operation-not-allowed': ['This sign-in method is not enabled in Firebase Authentication.', 'இந்த உள்நுழைவு முறையை Firebase Authentication-இல் இயக்கவும்.'],
    'auth/captcha-check-failed': ['The security check did not complete. Please retry.', 'பாதுகாப்புச் சரிபார்ப்பு முடிக்கப்படவில்லை. மீண்டும் முயற்சிக்கவும்.'],
    'auth/session-expired': ['This verification session expired. Request a new code or link.', 'சரிபார்ப்பு அமர்வு காலாவதியானது. புதிய குறியீடு அல்லது இணைப்பைக் கோரவும்.'],
    'auth/email-already-in-use': ['An account already uses this email. Choose Sign in.', 'இந்த மின்னஞ்சலுக்கு கணக்கு உள்ளது. உள்நுழையவும்.'],
    'auth/invalid-email': ['Enter a valid email address.', 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.'],
    'auth/weak-password': ['Choose a password with at least 6 characters.', 'குறைந்தது 6 எழுத்துகள் கொண்ட கடவுச்சொல்லைத் தேர்ந்தெடுக்கவும்.'],
    'auth/invalid-credential': ['Those sign-in details could not be verified.', 'உள்நுழைவு விவரங்களைச் சரிபார்க்க முடியவில்லை.'],
    'auth/missing-verification-code': ['Enter the OTP from your SMS.', 'SMS-இல் வந்த OTP-ஐ உள்ளிடவும்.'],
  };
  return messages[code]?.[tamil ? 1 : 0] || (tamil ? 'சரிபார்ப்பு தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.' : 'Verification failed. Please try again.');
}

function normalizePhone(value: string) {
  const cleaned = value.trim().replace(/[\s()-]/g, '');
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  return cleaned;
}

export const CitizenVerification: React.FC = () => {
  const { language, user, setActiveTab, showToast, refreshAuthenticatedUser } = useApp();
  const isTamil = language === 'ta';
  const [method, setMethod] = useState<Method>('phone');
  const [emailMode, setEmailMode] = useState<EmailMode>('register');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);
  const recaptchaHost = useRef<HTMLDivElement>(null);
  const recaptcha = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!resendSeconds) return;
    const timer = window.setTimeout(() => setResendSeconds((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  useEffect(() => () => recaptcha.current?.clear(), []);

  const getRecaptcha = () => {
    if (!recaptchaHost.current) throw new Error('Phone verification is not ready. Refresh and try again.');
    recaptcha.current?.clear();
    recaptcha.current = new RecaptchaVerifier(auth, recaptchaHost.current, { size: 'invisible' });
    return recaptcha.current;
  };

  const sendOtp = async (event?: FormEvent) => {
    event?.preventDefault();
    if (busy || resendSeconds > 0) return;
    const normalized = normalizePhone(phone);
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
      setError(isTamil ? 'சரியான எண்ணை உள்ளிடவும். இந்திய எண்ணுக்கு 10 இலக்கங்களை உள்ளிடலாம்.' : 'Enter a valid number, such as 10 digits for India or an international + number.');
      return;
    }
    setBusy(true); setError(''); setNotice('');
    try {
      setPhone(normalized);
      const result = await signInWithPhoneNumber(auth, normalized, getRecaptcha());
      setConfirmation(result);
      setResendSeconds(30);
      setNotice(isTamil ? `${normalized} எண்ணுக்கு OTP அனுப்பப்பட்டது.` : `An OTP was sent to ${normalized}.`);
    } catch (cause) {
      setError(authMessage(cause, language));
      recaptcha.current?.clear(); recaptcha.current = null;
    } finally { setBusy(false); }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (!confirmation || busy) return;
    setBusy(true); setError('');
    try {
      await confirmation.confirm(otp.trim());
      showToast(isTamil ? 'தொலைபேசி எண் சரிபார்க்கப்பட்டது.' : 'Phone number verified.', 'success');
      setActiveTab('file');
    } catch (cause) { setError(authMessage(cause, language)); }
    finally { setBusy(false); }
  };

  const emailAction = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (emailMode === 'register') {
        if (name.trim().length < 2 || name.trim().length > 120) throw new Error(isTamil ? 'பெயரை உள்ளிடவும்.' : 'Enter your name.');
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: name.trim() });
        await sendEmailVerification(credential.user);
      } else {
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        if (credential.user.emailVerified) setActiveTab('file');
        else setNotice(isTamil ? 'உள்நுழைந்துள்ளீர்கள். மின்னஞ்சல் இணைப்பை உறுதிப்படுத்தவும்; தேவைப்பட்டால் கீழே மீண்டும் அனுப்பவும்.' : 'Signed in. Verify the link in your email, or request another link below.');
      }
      setNotice(isTamil ? `சரிபார்ப்பு இணைப்பை ${email.trim()} முகவரிக்கு அனுப்பினோம். இணைப்பைத் திறந்த பிறகு நிலையைச் சரிபார்க்கவும்.` : `We sent a verification link to ${email.trim()}. Open it, then check your status here.`);
    } catch (cause) { setError(cause instanceof Error && !('code' in cause) ? cause.message : authMessage(cause, language)); }
    finally { setBusy(false); }
  };

  const checkEmailVerification = async () => {
    if (busy || !auth.currentUser) return;
    setBusy(true); setError('');
    try {
      await refreshAuthenticatedUser();
      if (auth.currentUser?.emailVerified) {
        showToast(isTamil ? 'மின்னஞ்சல் சரிபார்க்கப்பட்டது.' : 'Email verified.', 'success');
        setActiveTab('file');
      } else {
        setNotice(isTamil ? 'சரிபார்ப்பு இணைப்பைத் திறந்த பிறகு மீண்டும் முயற்சிக்கவும்.' : 'Verification is not complete yet. Open the email link, then check again.');
      }
    } catch (cause) { setError(authMessage(cause, language)); }
    finally { setBusy(false); }
  };

  const resendEmail = async () => {
    if (!auth.currentUser || busy) return;
    setBusy(true); setError('');
    try {
      await sendEmailVerification(auth.currentUser);
      setNotice(isTamil ? 'சரிபார்ப்பு மின்னஞ்சல் மீண்டும் அனுப்பப்பட்டது.' : 'Verification email sent again. Check your inbox and spam folder.');
    } catch (cause) { setError(authMessage(cause, language)); }
    finally { setBusy(false); }
  };

  return (
    <section className="mx-auto w-full max-w-xl" aria-labelledby="citizen-verification-title">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <button type="button" onClick={() => setActiveTab('home')} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />{isTamil ? 'முகப்புக்குத் திரும்பு' : 'Back to home'}
        </button>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-700 text-white"><ShieldCheck className="h-6 w-6" aria-hidden="true" /></div>
          <div>
            <h1 id="citizen-verification-title" className="text-xl font-bold text-slate-900">{isTamil ? 'புகார் பதிவு செய்ய கணக்கைச் சரிபார்க்கவும்' : 'Verify your account to file a grievance'}</h1>
            <p className="mt-1 text-sm text-slate-600">{isTamil ? 'தொலைபேசி OTP அல்லது சரிபார்க்கப்பட்ட மின்னஞ்சலைத் தேர்வு செய்யவும்.' : 'Choose phone OTP or a verified email address.'}</p>
          </div>
        </div>

        {user && !user.isAnonymous && !user.emailVerified && !user.phoneNumber ? (
          <div className="space-y-4 rounded-xl border border-amber-300 bg-amber-50 p-4" aria-live="polite">
            <p className="font-semibold text-amber-950">{isTamil ? 'மின்னஞ்சல் சரிபார்ப்பு தேவை' : 'Email verification required'}</p>
            <p className="text-sm text-amber-900">{isTamil ? `${user.email ?? 'உங்கள் மின்னஞ்சல்'} முகவரியைச் சரிபார்க்கவும். இணைப்பு கிடைக்காவிட்டால் மீண்டும் அனுப்பவும்.` : `Verify ${user.email ?? 'your email address'}. If you cannot find the link, request another one.`}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={checkEmailVerification} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? (isTamil ? 'சரிபார்க்கிறது…' : 'Checking…') : (isTamil ? 'சரிபார்ப்பு நிலையைப் பார்க்கவும்' : 'Check verification status')}</button>
              <button type="button" disabled={busy} onClick={resendEmail} className="rounded-lg border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 disabled:opacity-60">{isTamil ? 'மின்னஞ்சலை மீண்டும் அனுப்பு' : 'Resend email'}</button>
              <button type="button" onClick={() => void signOut(auth)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 underline">{isTamil ? 'வெளியேறு' : 'Sign out'}</button>
            </div>
          </div>
        ) : (
          <>
            <div role="tablist" aria-label={isTamil ? 'சரிபார்ப்பு முறை' : 'Verification method'} className="mb-5 grid grid-cols-2 gap-2">
              <button type="button" role="tab" aria-selected={method === 'phone'} onClick={() => { setMethod('phone'); setError(''); }} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold ${method === 'phone' ? 'border-indigo-700 bg-indigo-50 text-indigo-900' : 'border-slate-300 text-slate-700'}`}><Phone className="h-4 w-4" aria-hidden="true" />{isTamil ? 'தொலைபேசி OTP' : 'Phone OTP'}</button>
              <button type="button" role="tab" aria-selected={method === 'email'} onClick={() => { setMethod('email'); setError(''); }} className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold ${method === 'email' ? 'border-indigo-700 bg-indigo-50 text-indigo-900' : 'border-slate-300 text-slate-700'}`}><Mail className="h-4 w-4" aria-hidden="true" />{isTamil ? 'மின்னஞ்சல்' : 'Email'}</button>
            </div>

            {method === 'phone' ? confirmation ? (
              <form onSubmit={verifyOtp} className="space-y-4">
                <p className="text-sm text-slate-700">{isTamil ? `${phone} எண்ணுக்கு அனுப்பிய 6 இலக்க OTP-ஐ உள்ளிடவும்.` : `Enter the 6-digit code sent to ${phone}.`}</p>
                <label htmlFor="citizen-otp" className="block text-sm font-semibold text-slate-800">{isTamil ? 'ஒருமுறை கடவுச்சொல்' : 'One-time password'}</label>
                <input id="citizen-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required className="w-full rounded-lg border border-slate-300 px-3 py-3 text-lg tracking-[0.35em] focus:outline-none focus:ring-2 focus:ring-indigo-700" />
                <button type="submit" disabled={busy || otp.length !== 6} className="w-full rounded-lg bg-indigo-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? (isTamil ? 'சரிபார்க்கிறது…' : 'Verifying…') : (isTamil ? 'OTP சரிபார்க்கவும்' : 'Verify OTP')}</button>
                <button type="button" disabled={busy || resendSeconds > 0} onClick={() => void sendOtp()} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 disabled:opacity-60">{resendSeconds ? (isTamil ? `${resendSeconds} விநாடிகளில் மீண்டும் அனுப்பலாம்` : `Resend available in ${resendSeconds}s`) : (isTamil ? 'OTP மீண்டும் அனுப்பு' : 'Resend OTP')}</button>
                <button type="button" onClick={() => { setConfirmation(null); setOtp(''); setError(''); }} className="w-full text-sm text-slate-600 underline">{isTamil ? 'எண்ணை மாற்று' : 'Change phone number'}</button>
              </form>
            ) : (
              <form onSubmit={(event) => void sendOtp(event)} className="space-y-4">
                <label htmlFor="citizen-phone" className="block text-sm font-semibold text-slate-800">{isTamil ? 'மொபைல் எண்' : 'Mobile number'}</label>
                <input id="citizen-phone" type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" required className="w-full rounded-lg border border-slate-300 px-3 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-700" />
                <p className="text-xs text-slate-600">{isTamil ? 'OTP அனுப்ப Firebase reCAPTCHA சரிபார்ப்பைப் பயன்படுத்துகிறது.' : 'Firebase uses reCAPTCHA to protect OTP requests.'}</p>
                {resendSeconds > 0 && <p className="text-xs text-slate-600">{isTamil ? `${resendSeconds} விநாடிகள் கழித்து முயற்சிக்கவும்.` : `Please wait ${resendSeconds}s before requesting another code.`}</p>}
                <button type="submit" disabled={busy || resendSeconds > 0} className="w-full rounded-lg bg-indigo-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? (isTamil ? 'OTP அனுப்புகிறது…' : 'Sending OTP…') : (isTamil ? 'OTP அனுப்பு' : 'Send OTP')}</button>
              </form>
            ) : (
              user && !user.isAnonymous && user.emailVerified ? (
                <div className="space-y-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4" aria-live="polite">
                  <p className="flex items-center gap-2 font-semibold text-emerald-900"><CheckCircle2 className="h-5 w-5" aria-hidden="true" />{isTamil ? 'மின்னஞ்சல் சரிபார்க்கப்பட்டது' : 'Email verified'}</p>
                  <button type="button" onClick={() => setActiveTab('file')} className="rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white">{isTamil ? 'புகார் பதிவுக்குச் செல்லவும்' : 'Continue to grievance form'}</button>
                </div>
              ) : (
                <form onSubmit={emailAction} className="space-y-4">
                  <div className="flex gap-4 text-sm">
                    <button type="button" onClick={() => setEmailMode('register')} className={emailMode === 'register' ? 'font-bold text-indigo-800 underline' : 'text-slate-600'}>{isTamil ? 'புதிய கணக்கு' : 'Create account'}</button>
                    <button type="button" onClick={() => setEmailMode('login')} className={emailMode === 'login' ? 'font-bold text-indigo-800 underline' : 'text-slate-600'}>{isTamil ? 'உள்நுழை' : 'Sign in'}</button>
                  </div>
                  {emailMode === 'register' && <div><label htmlFor="citizen-name" className="mb-1 block text-sm font-semibold text-slate-800">{isTamil ? 'முழுப் பெயர்' : 'Full name'}</label><input id="citizen-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" /></div>}
                  <div><label htmlFor="citizen-email" className="mb-1 block text-sm font-semibold text-slate-800">{isTamil ? 'மின்னஞ்சல் முகவரி' : 'Email address'}</label><input id="citizen-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" /></div>
                  <div><label htmlFor="citizen-password" className="mb-1 block text-sm font-semibold text-slate-800">{isTamil ? 'கடவுச்சொல்' : 'Password'}</label><input id="citizen-password" type="password" autoComplete={emailMode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} className="w-full rounded-lg border border-slate-300 px-3 py-2.5" /></div>
                  <button type="submit" disabled={busy} className="w-full rounded-lg bg-indigo-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? (isTamil ? 'செயல்படுகிறது…' : 'Please wait…') : emailMode === 'register' ? (isTamil ? 'கணக்கை உருவாக்கி சரிபார்ப்பு மின்னஞ்சல் அனுப்பு' : 'Create account and send verification email') : (isTamil ? 'உள்நுழை' : 'Sign in')}</button>
                </form>
              )
            )}
          </>
        )}

        <div ref={recaptchaHost} />
        {notice && <p role="status" className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">{notice}</p>}
        {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
      </div>
      <p className="mt-4 text-center text-xs leading-relaxed text-slate-600">{isTamil ? 'உங்கள் தொடர்பு விவரங்களை சரிபார்ப்பிற்காக Firebase Authentication கையாளும். OTP அல்லது கடவுச்சொல் புகார் பதிவில் சேமிக்கப்படாது.' : 'Firebase Authentication verifies your contact details. OTP codes and passwords are not stored in grievance records.'}</p>
    </section>
  );
};
