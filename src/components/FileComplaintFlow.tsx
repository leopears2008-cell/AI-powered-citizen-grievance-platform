import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { GrievanceForm } from './GrievanceForm';
import { ArrowRight, Check, ShieldCheck, Smartphone, KeyRound, FileText, Pencil } from 'lucide-react';

interface Props {
  initialTranscript?: string;
  initialLanguage?: string;
  onOpenVoiceModal: () => void;
}

type Stage = 'gate' | 'mobile' | 'otp' | 'form';

const STAGE_INDEX: Record<Stage, number> = { gate: 0, mobile: 1, otp: 2, form: 3 };
const STEPS = ['Initiate', 'Mobile Number', 'OTP Verify', 'Register Complaint'];

// Demo OTP. Replace sendOtp()/handleVerify() with real backend calls before production.
const DEMO_OTP = '123456';
const RESEND_SECONDS = 30;
const MAX_ATTEMPTS = 5;

export const FileComplaintFlow: React.FC<Props> = ({ initialTranscript, initialLanguage, onOpenVoiceModal }) => {
  const { showToast } = useApp();

  const [stage, setStage] = useState<Stage>('gate');
  const [mobile, setMobile] = useState('');
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [attempts, setAttempts] = useState(0);
  const [verifiedMobile, setVerifiedMobile] = useState('');
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const validMobile = /^[6-9]\d{9}$/.test(mobile);
  const otp = digits.join('');

  // Resend countdown
  useEffect(() => {
    if (stage !== 'otp' || seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [stage, seconds]);

  const sendOtp = () => {
    // Simulated send. Wire this to your backend SMS/OTP endpoint when available.
    setDigits(Array(6).fill(''));
    setSeconds(RESEND_SECONDS);
    showToast(`Demo OTP sent: ${DEMO_OTP}`, 'info');
  };

  const handleSendOtp = () => {
    if (!validMobile) return;
    sendOtp();
    setAttempts(0);
    setStage('otp');
    setTimeout(() => boxes.current[0]?.focus(), 50);
  };

  const handleVerify = () => {
    if (otp.length !== 6) return;
    if (otp === DEMO_OTP) {
      setVerifiedMobile(`+91 ${mobile}`);
      showToast('Mobile number verified', 'success');
      setStage('form');
      return;
    }
    const used = attempts + 1;
    setAttempts(used);
    setDigits(Array(6).fill(''));
    if (used >= MAX_ATTEMPTS) {
      showToast('Too many incorrect attempts. Please request a new OTP.', 'error');
      setStage('mobile');
      return;
    }
    showToast(`Incorrect OTP. ${MAX_ATTEMPTS - used} attempt(s) left.`, 'error');
    boxes.current[0]?.focus();
  };

  const setDigitAt = (i: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    const next = [...digits];
    if (!cleaned) {
      next[i] = '';
      setDigits(next);
      return;
    }
    cleaned.split('').forEach((c, k) => {
      if (i + k < 6) next[i + k] = c;
    });
    setDigits(next);
    boxes.current[Math.min(i + cleaned.length, 5)]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) boxes.current[i - 1]?.focus();
    if (e.key === 'Enter' && otp.length === 6) handleVerify();
  };

  const current = STAGE_INDEX[stage];

  // Horizontal progress bar
  const Stepper = (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card">
      <ol className="grid grid-cols-4 gap-2">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex flex-col items-center text-center space-y-1.5">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  done
                    ? 'bg-ai border-ai text-white'
                    : active
                    ? 'bg-navy border-navy text-white'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </span>
              <span className={`text-[11px] sm:text-xs font-semibold ${active ? 'text-navy' : done ? 'text-emerald-700' : 'text-slate-400'}`}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );

  const cardClass = 'max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8 space-y-6';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {Stepper}

      {/* Step 1: entry gate */}
      {stage === 'gate' && (
        <div className={`${cardClass} text-center`}>
          <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-tint text-navy flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-navy">Citizen Authentication</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              To keep every grievance genuine and trackable, we first verify your mobile number with a one-time password.
            </p>
          </div>
          <ul className="text-left text-xs text-slate-600 space-y-2 bg-slate-50 rounded-xl p-4 border border-slate-200">
            <li className="flex items-center space-x-2"><Smartphone className="w-4 h-4 text-ai" /><span>Enter your mobile number</span></li>
            <li className="flex items-center space-x-2"><KeyRound className="w-4 h-4 text-ai" /><span>Confirm the 6-digit OTP</span></li>
            <li className="flex items-center space-x-2"><FileText className="w-4 h-4 text-ai" /><span>Register your grievance</span></li>
          </ul>
          <button
            type="button"
            onClick={() => setStage('mobile')}
            className="w-full bg-navy hover:bg-navy-dark text-white font-bold text-sm py-3 rounded-full inline-flex items-center justify-center space-x-2 transition-colors"
          >
            <span>Start Verification</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: mobile number */}
      {stage === 'mobile' && (
        <div className={cardClass}>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-extrabold text-navy">Verify Your Mobile Number</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Enter your 10-digit mobile number to receive a One-Time Password (OTP) for grievance registration and SMS tracking.
            </p>
          </div>
          <div>
            <label htmlFor="mobile" className="text-xs font-semibold text-slate-600 block mb-1.5">
              Mobile Number *
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 text-sm font-bold text-navy">
                +91
              </span>
              <input
                id="mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={(e) => e.key === 'Enter' && validMobile && handleSendOtp()}
                placeholder="98765 43210"
                className="flex-1 min-w-0 p-3 text-base font-mono tracking-wider text-slate-900 border border-slate-300 rounded-r-xl focus:ring-2 focus:ring-navy focus:outline-none"
              />
            </div>
            {mobile.length > 0 && !validMobile && (
              <p className="text-[11px] text-red-600 mt-1.5">
                Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9.
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={!validMobile}
            onClick={handleSendOtp}
            className="w-full bg-navy hover:bg-navy-dark disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-full inline-flex items-center justify-center space-x-2 transition-colors"
          >
            <span>Send OTP</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 3: OTP */}
      {stage === 'otp' && (
        <div className={cardClass}>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-extrabold text-navy">Enter Verification Code (OTP)</h2>
            <p className="text-sm text-slate-600">
              We have sent a 6-digit OTP to <span className="font-mono font-semibold text-navy">+91 XXXXXX{mobile.slice(6)}</span>
            </p>
            <button
              type="button"
              onClick={() => setStage('mobile')}
              className="text-xs font-semibold text-action hover:underline inline-flex items-center space-x-1"
            >
              <Pencil className="w-3 h-3" />
              <span>Edit Number</span>
            </button>
          </div>

          <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  boxes.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={6}
                value={d}
                aria-label={`OTP digit ${i + 1}`}
                onChange={(e) => setDigitAt(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono text-navy border-2 border-slate-300 rounded-xl focus:border-ai focus:ring-2 focus:ring-ai/30 focus:outline-none"
              />
            ))}
          </div>

          <p className="text-center text-xs text-slate-500">
            {seconds > 0 ? (
              <>Resend OTP in 00:{String(seconds).padStart(2, '0')}s</>
            ) : (
              <button type="button" onClick={sendOtp} className="font-semibold text-action hover:underline">
                Resend OTP
              </button>
            )}
          </p>

          <button
            type="button"
            disabled={otp.length !== 6}
            onClick={handleVerify}
            className="w-full bg-ai hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-full inline-flex items-center justify-center space-x-2 transition-colors"
          >
            <span>Verify &amp; Proceed</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 4: registration form */}
      {stage === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-full text-xs font-bold">
              <Check className="w-4 h-4" />
              <span>Verified Citizen Mobile: {verifiedMobile}</span>
            </div>
            <GrievanceForm
              initialTranscript={initialTranscript}
              initialLanguage={initialLanguage}
              onOpenVoiceModal={onOpenVoiceModal}
              verifiedMobile={verifiedMobile}
            />
          </div>

          <aside className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-card p-6 lg:sticky lg:top-28">
            <h3 className="text-sm font-bold text-navy mb-4">Your Progress</h3>
            <ol className="space-y-5">
              {STEPS.map((label, i) => {
                const done = i < 3;
                return (
                  <li key={label} className="flex items-center space-x-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        done ? 'bg-ai text-white' : 'bg-navy text-white'
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" /> : i + 1}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${done ? 'text-emerald-700' : 'text-navy'}`}>{label}</p>
                      <p className="text-[11px] text-slate-500">
                        {i === 1 ? verifiedMobile : done ? 'Completed' : 'In progress'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </aside>
        </div>
      )}
    </div>
  );
};
