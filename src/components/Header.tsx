import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Globe,
  ShieldCheck,
  Menu,
  X,
  FileText,
  Search,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Contact,
  Newspaper,
  Map as MapIcon,
} from 'lucide-react';

interface HeaderProps {
  siteTitle?: string;
  siteSubtitle?: string;
  showDirectory?: boolean;
  showMinisters?: boolean;
  showNews?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ siteTitle = 'NivaranAI', siteSubtitle = 'Grievance System', showDirectory = true, showMinisters = true, showNews = true }) => {
  const {
    language,
    setLanguage,
    t,
    activeTab,
    setActiveTab,
    notifications,
    unreadCount,
    markAsRead,
    navigateToTrack,
    isAdmin,
    logout,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileAndOpen = (tab: Parameters<typeof setActiveTab>[0]) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="site-header sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-lg shrink-0">
      <div className="h-1 w-full bg-slate-700" aria-hidden="true" />

      <div className="site-header-topbar bg-slate-950 text-slate-300 text-xs py-1.5 px-4 sm:px-8 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Citizen Grievance Portal
          </span>
          <span className="hidden sm:inline">{t.portalTagline}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-slate-500 hidden md:inline text-[11px]">
            {t.emblemSubtitle}
          </span>
          <div className="flex items-center space-x-1 bg-slate-800 rounded px-2 py-0.5 border border-slate-700">
            <Globe className="w-3 h-3 text-indigo-400" />
            <button
              onClick={() => setLanguage('en')}
              className={`text-[11px] font-medium px-1 transition-colors ${
                language === 'en' ? 'text-white font-bold underline decoration-indigo-400 underline-offset-2' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              English
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => setLanguage('ta')}
              className={`text-[11px] font-medium px-1 transition-colors ${
                language === 'ta' ? 'text-white font-bold underline decoration-indigo-400 underline-offset-2' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('home')}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') setActiveTab('home');
            }}
            aria-label="Go to home"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center overflow-hidden rounded-lg bg-white/95 p-0.5 shadow-sm">
              <img
                src="/logo.webp"
                alt="NivaranAI Public Grievance Redressal Platform"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-semibold tracking-tight text-white font-sans">
                  {siteTitle} <span className="text-indigo-400 text-sm font-normal">| {siteSubtitle}</span>
                </span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-1 lg:space-x-4">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'home'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t.navHome}
            </button>

            <button
              onClick={() => setActiveTab('file')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'file'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{t.navFileComplaint}</span>
            </button>

            <button
              onClick={() => setActiveTab('track')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'track'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>{t.navTrack}</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t.navHistory}
            </button>

            {showDirectory && <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'directory'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Contact className="w-4 h-4" />
              <span>{t.navDirectory}</span>
            </button>}

            {showMinisters && <button
              onClick={() => setActiveTab('ministers')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'ministers'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              aria-label="Open Tamil Nadu ministers directory"
            >
              <Contact className="w-4 h-4" />
              <span>{language === 'ta' ? 'தமிழ்நாட்டு அமைச்சர்கள்' : 'TN Ministers'}</span>
            </button>}

            {showNews && <button
              onClick={() => setActiveTab('news')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'news'
                  ? 'bg-red-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              aria-label="Open live news"
            >
              <Newspaper className="w-4 h-4" />
              <span>{language === 'ta' ? 'நேரலி செய்திகள்' : 'Live News'}</span>
            </button>}

            {isAdmin && (
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                  activeTab === 'analytics'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>{t.navAnalytics}</span>
              </button>
            )}
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 relative transition-colors"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center space-x-1.5">
                      <Bell className="w-4 h-4 text-blue-700" />
                      <span className="font-semibold text-sm text-slate-800">
                        {language === 'ta' ? 'அறிவிப்புகள்' : 'Live Notifications'}
                      </span>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                      {unreadCount} {language === 'ta' ? 'புதியவை' : 'unread'}
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        {language === 'ta' ? 'புதிய அறிவிப்புகள் இல்லை' : 'No notifications yet'}
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id);
                            navigateToTrack(n.grievanceId);
                            setIsNotifOpen(false);
                          }}
                          className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                            !n.read ? 'bg-blue-50/60' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-1.5">
                              {n.type === 'resolution' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                              )}
                              <p className="text-xs font-bold text-slate-800">
                                {language === 'ta' ? n.titleTa : n.title}
                              </p>
                            </div>
                            <span className="text-[10px] text-blue-700 font-mono font-semibold">
                              {n.grievanceId}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {language === 'ta' ? n.messageTa : n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-medium transition-colors"
                aria-label="Open admin dashboard"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Admin</span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs font-semibold text-slate-300 hover:text-white px-2 py-1"
                >
                  Logout
                </button>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800"
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 space-y-1">
            <button onClick={() => closeMobileAndOpen('home')} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100">
              {t.navHome}
            </button>
            <button onClick={() => closeMobileAndOpen('file')} className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-blue-700 bg-blue-50">
              {t.navFileComplaint}
            </button>
            <button onClick={() => closeMobileAndOpen('track')} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100">
              {t.navTrack}
            </button>
            <button onClick={() => closeMobileAndOpen('history')} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100">
              {t.navHistory}
            </button>
            {showDirectory && <button onClick={() => closeMobileAndOpen('directory')} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100">
              {t.navDirectory}
            </button>}
            {showMinisters && <button onClick={() => closeMobileAndOpen('ministers')} className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-indigo-700 bg-indigo-50 flex items-center gap-2">
              <Contact className="w-4 h-4" />
              {language === 'ta' ? 'தமிழ்நாட்டு அமைச்சர்கள்' : 'TN Ministers'}
            </button>}
            {showNews && <button
              onClick={() => closeMobileAndOpen('news')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-red-700 bg-red-50 flex items-center gap-2"
            >
              <Newspaper className="w-4 h-4" />
              {language === 'ta' ? 'நேரலி செய்திகள்' : 'Live News'}
            </button>}
            <button
              onClick={() => closeMobileAndOpen('map')}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-emerald-300 bg-slate-900 border border-emerald-700/50 flex items-center gap-2"
              aria-label="Open map"
            >
              <MapIcon className="w-4 h-4" />
              {language === 'ta' ? 'வரைபடம் திறக்க' : 'Open Map'}
            </button>
            <button onClick={() => closeMobileAndOpen('admin')} className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-indigo-700 bg-indigo-50">
              Admin Dashboard
            </button>

            {isAdmin && (
              <button onClick={() => closeMobileAndOpen('analytics')} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100">
                {t.navAnalytics}
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
