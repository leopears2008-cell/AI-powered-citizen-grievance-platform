import React, { lazy, Suspense, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { LegalPage } from './components/LegalPage';
import { InteractiveMap } from './components/InteractiveMap';
import { FAQSection } from './components/FAQSection';
import { AIDemoCard } from './components/AIDemoCard';
import { GrievanceChatbot } from './components/GrievanceChatbot';
import { PageSkeleton } from './components/Skeleton';
import { PublicTransparencyDashboard } from './components/PublicTransparencyDashboard';
import type { SiteSettings } from './types';
const VoiceInputModal = lazy(() => import('./components/VoiceInputModal').then((module) => ({ default: module.VoiceInputModal })));
const GrievanceForm = lazy(() => import('./components/GrievanceForm').then((module) => ({ default: module.GrievanceForm })));
const CitizenVerification = lazy(() => import('./components/CitizenVerification').then((module) => ({ default: module.CitizenVerification })));
const CitizenTracker = lazy(() => import('./components/CitizenTracker').then((module) => ({ default: module.CitizenTracker })));
const CitizenHistory = lazy(() => import('./components/CitizenHistory').then((module) => ({ default: module.CitizenHistory })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const AdminLogin = lazy(() => import('./components/AdminLogin').then((module) => ({ default: module.AdminLogin })));
const AnalyticsView = lazy(() => import('./components/AnalyticsView').then((module) => ({ default: module.AnalyticsView })));
const MLADirectory = lazy(() => import('./components/MLADirectory').then((module) => ({ default: module.MLADirectory })));
const TNMinistersDirectory = lazy(() => import('./components/TNMinistersDirectory').then((module) => ({ default: module.TNMinistersDirectory })));
const LiveNews = lazy(() => import('./components/LiveNews').then((module) => ({ default: module.LiveNews })));
import {
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { api } from './services/api';

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 'default', siteTitle: 'NivaranAI Grievance Portal', siteSubtitle: 'AI-assisted civic grievance management', announcement: '', chatbotEnabled: true, showHero: true, showAIDemo: true, showMap: true, showFAQ: true, showDirectory: true, showMinisters: true, showNews: true,
};

const MainLayout: React.FC = () => {
  const { language, activeTab, setActiveTab, toasts, removeToast, isAdmin, authLoading, isCitizenVerified } = useApp();

  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [initialVoiceTranscript, setInitialVoiceTranscript] = useState('');
  const [initialVoiceLang, setInitialVoiceLang] = useState('Tamil');
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [showStorageNotice, setShowStorageNotice] = useState(false);

  React.useEffect(() => {
    try {
      setShowStorageNotice(localStorage.getItem('nivaranai.storage-notice.v1') !== 'accepted');
    } catch {
      // Privacy controls must never prevent the grievance service from rendering.
      setShowStorageNotice(false);
    }
  }, []);

  const acceptStorageNotice = () => {
    try {
      localStorage.setItem('nivaranai.storage-notice.v1', 'accepted');
    } catch {
      // Storage may be blocked; the notice can still be dismissed for this session.
    }
    setShowStorageNotice(false);
  };

  React.useEffect(() => {
    api.getSiteSettings().then(setSiteSettings).catch(() => setSiteSettings(DEFAULT_SITE_SETTINGS));
  }, []);

  const handleVoiceTranscriptConfirmed = (transcript: string, langHint: string) => {
    setInitialVoiceTranscript(transcript);
    setInitialVoiceLang(langHint);
    setActiveTab('file');
  };

  return (
    <div className="site-shell min-h-screen font-sans text-slate-900 flex flex-col justify-between selection:bg-slate-200 selection:text-slate-950">
      <div aria-live="polite" aria-relevant="additions text" className="fixed top-20 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start space-x-3 animate-in fade-in slide-in-from-top-4 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
                : toast.type === 'error'
                ? 'bg-red-900 text-red-50 border-red-700'
                : toast.type === 'warning'
                ? 'bg-amber-900 text-amber-50 border-amber-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <p className="text-xs font-medium leading-snug flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5"
              aria-label={language === 'ta' ? 'அறிவிப்பை மூடு' : 'Dismiss notification'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {isVoiceModalOpen && (
        <VoiceInputModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onTranscriptConfirmed={handleVoiceTranscriptConfirmed}
        />
      )}

      <Header siteTitle={siteSettings.siteTitle} siteSubtitle={siteSettings.siteSubtitle} showDirectory={siteSettings.showDirectory} showMinisters={siteSettings.showMinisters} showNews={siteSettings.showNews} />

      <main className="site-main max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col space-y-8 overflow-y-auto">
        <Suspense fallback={<PageSkeleton label={language === 'ta' ? 'பக்கத்தை ஏற்றுகிறது…' : 'Loading page…'} />}>
          {activeTab === 'home' && (
            <div className="space-y-8">
              {siteSettings.announcement && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900" role="status">
                  {siteSettings.announcement}
                </div>
              )}
              {siteSettings.showHero && (
                <HeroSection
                  onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
                  onSelectCategory={() => {
                    setInitialVoiceTranscript('');
                    setActiveTab('file');
                  }}
                />
              )}
              {siteSettings.chatbotEnabled && (
                <GrievanceChatbot onStartComplaint={(draft) => {
                  setInitialVoiceTranscript(draft);
                  setInitialVoiceLang('English');
                  setActiveTab('file');
                }} />
              )}
              {siteSettings.showAIDemo && <AIDemoCard />}
              {siteSettings.showMap && <InteractiveMap />}
              <PublicTransparencyDashboard />
              {siteSettings.showFAQ && <FAQSection />}
            </div>
          )}

          {activeTab === 'file' && (
            <div>
              {authLoading ? (
                <div role="status" className="py-16 text-center text-sm text-slate-600">{language === 'ta' ? 'அங்கீகாரத்தைச் சரிபார்க்கிறது…' : 'Checking your account…'}</div>
              ) : isCitizenVerified ? (
                <GrievanceForm
                  initialTranscript={initialVoiceTranscript}
                  initialLanguage={initialVoiceLang}
                  onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
                />
              ) : (
                <CitizenVerification />
              )}
            </div>
          )}

          {activeTab === 'track' && (
            <div className="animate-in fade-in duration-300">
              <CitizenTracker />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-in fade-in duration-300">
              <CitizenHistory />
            </div>
          )}

          {activeTab === 'directory' && (
            <div className="animate-in fade-in duration-300">
              <MLADirectory />
            </div>
          )}

          {activeTab === 'ministers' && (
            <div className="animate-in fade-in duration-300">
              <TNMinistersDirectory />
            </div>
          )}

          {activeTab === 'news' && (
            <div className="animate-in fade-in duration-300">
              <LiveNews />
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="animate-in fade-in duration-300">
              {authLoading ? (
                <div className="py-16 text-center text-sm text-slate-500" role="status">Checking admin access…</div>
              ) : isAdmin ? (
                <AdminDashboard />
              ) : (
                <AdminLogin />
              )}
            </div>
          )}

          {activeTab === 'analytics' && isAdmin && (
            <div className="animate-in fade-in duration-300">
              <AnalyticsView />
            </div>
          )}

          {(activeTab === 'privacy' || activeTab === 'terms' || activeTab === 'cookies' || activeTab === 'refund') && (
            <LegalPage type={activeTab} />
          )}
        </Suspense>
      </main>

      <footer className="site-footer text-slate-700 text-xs border-t border-white/30 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-base">
                <span className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-serif">
                  நி
                </span>
                <span>NivaranAI Grievance Portal</span>
              </div>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                AI-assisted civic grievance management interface. Government identity, authority and service ownership must be configured and verified before production use.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
                {language === 'ta' ? 'அவசர உதவி எண்கள்' : 'Emergency Hotlines'}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="block font-mono text-slate-700">112 · Emergency</span>
                <span className="block font-mono text-slate-700">108 · Ambulance</span>
                <span className="block font-mono text-slate-700">181 · Women Helpline</span>
                <span className="block font-mono text-slate-700">1098 · Child Helpline</span>
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
                {language === 'ta' ? 'அணுகல்தன்மை & பாதுகாப்பு' : 'Accessibility & Privacy'}
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Accessibility and security controls are being implemented; no certification or compliance claim is made by this demo.
              </p>
            </div>
          </div>

          <nav aria-label="Legal" className="pt-6 flex flex-wrap gap-4 text-xs text-slate-500">
            <button onClick={() => setActiveTab('privacy')} className="hover:text-slate-900 underline underline-offset-2">Privacy Policy</button>
            <button onClick={() => setActiveTab('terms')} className="hover:text-slate-900 underline underline-offset-2">Terms</button>
            <button onClick={() => setActiveTab('cookies')} className="hover:text-slate-900 underline underline-offset-2">Cookie Policy</button>
            <button onClick={() => setActiveTab('refund')} className="hover:text-slate-900 underline underline-offset-2">Refund Policy</button>
          </nav>

          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 font-medium uppercase tracking-widest gap-2">
            <p>© 2026 NivaranAI demo application. Organization ownership and legal notices must be configured before production.</p>
            <p>NivaranAI Grievance Management System — pre-production build</p>
          </div>
        </div>
      </footer>

      {showStorageNotice && (
        <aside
          role="dialog"
          aria-label="Browser storage notice"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 rounded-xl border border-slate-300 bg-white p-4 shadow-2xl"
        >
          <p className="text-sm font-bold text-slate-900">Privacy & browser storage</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            This service uses essential browser storage for authentication. No advertising or optional analytics trackers are configured. Read the Cookie Policy for details.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={acceptStorageNotice}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 focus-visible:outline"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => { setShowStorageNotice(false); setActiveTab('cookies'); }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline"
            >
              Cookie Policy
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
