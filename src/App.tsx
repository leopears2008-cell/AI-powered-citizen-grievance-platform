import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeLanding } from './components/HomeLanding';
import { VoiceInputModal } from './components/VoiceInputModal';
import { GrievanceForm } from './components/GrievanceForm';
import { CitizenTracker } from './components/CitizenTracker';
import { CitizenHistory } from './components/CitizenHistory';
import { AdminDashboard } from './components/AdminDashboard';
import { OfficerPortal } from './components/OfficerPortal';
import { MLADirectory } from './components/MLADirectory';
import { InteractiveMap } from './components/InteractiveMap';
import { CivicServicesHub } from './components/CivicServicesHub';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, toasts, removeToast } = useApp();

  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [initialVoiceTranscript, setInitialVoiceTranscript] = useState('');
  const [initialVoiceLang, setInitialVoiceLang] = useState('Tamil');

  const handleVoiceTranscriptConfirmed = (transcript: string, langHint: string) => {
    setInitialVoiceTranscript(transcript);
    setInitialVoiceLang(langHint);
    setActiveTab('file');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900">
      {/* Toasts */}
      <div className="fixed top-24 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full">
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
            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-white p-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <VoiceInputModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onTranscriptConfirmed={handleVoiceTranscriptConfirmed}
      />

      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col space-y-8">
        {activeTab === 'home' && (
          <div className="space-y-16 animate-in fade-in duration-300">
            <HomeLanding onOpenVoiceModal={() => setIsVoiceModalOpen(true)} />
            <InteractiveMap />
            <CivicServicesHub />
          </div>
        )}

        {activeTab === 'file' && (
          <div className="animate-in fade-in duration-300">
            <GrievanceForm
              initialTranscript={initialVoiceTranscript}
              initialLanguage={initialVoiceLang}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            />
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

        {activeTab === 'admin' && (
          <div className="animate-in fade-in duration-300">
            <AdminDashboard />
          </div>
        )}

        {activeTab === 'officer' && (
          <div className="animate-in fade-in duration-300">
            <OfficerPortal />
          </div>
        )}

        {/* 'analytics' is retired: any stale link lands on the live map */}
        {(activeTab === 'map' || activeTab === 'analytics') && (
          <div className="animate-in fade-in duration-300">
            <InteractiveMap tall />
          </div>
        )}

        {activeTab === 'directory' && (
          <div className="animate-in fade-in duration-300">
            <MLADirectory />
          </div>
        )}
      </main>

      <Footer />
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
