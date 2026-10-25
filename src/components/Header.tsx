import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Bell, User, Menu, X, CheckCircle2, AlertCircle } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    language,
    setLanguage,
    t,
    setRole,
    activeTab,
    setActiveTab,
    notifications,
    unreadCount,
    markAsRead,
    navigateToTrack,
    user,
    login,
    logout,
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const go = (tab: string, role: UserRole = 'CITIZEN') => {
    setRole(role);
    setActiveTab(tab as never);
    setIsMobileMenuOpen(false);
  };

  const links: { tab: string; label: string; role?: UserRole }[] = [
    { tab: 'home', label: t.navHome },
    { tab: 'file', label: t.navFileComplaint },
    { tab: 'track', label: t.navTrack },
    { tab: 'history', label: t.navHistory },
    { tab: 'directory', label: t.navDirectory },
    { tab: 'analytics', label: t.navAnalytics },
    { tab: 'officer', label: t.roleOfficer, role: 'OFFICER' },
    { tab: 'admin', label: t.roleAdmin, role: 'ADMIN' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => go('home')}>
          <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center text-white text-lg font-bold border-2 border-emerald-400 shadow-sm">
            TN
          </div>
          <div>
            <div className="flex items-center text-2xl font-extrabold tracking-tight leading-none">
              <span className="text-navy">Nivaran</span>
              <span className="text-ai ml-0.5">AI</span>
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-tight mt-1">
              AI-Powered Citizen Grievance Platform
              <br />
              Government of Tamil Nadu
            </div>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden xl:flex items-center space-x-1 font-medium text-sm">
          {links.map((l) => (
            <button
              key={l.tab}
              onClick={() => go(l.tab, l.role)}
              className={`px-3 py-2 border-b-2 transition-colors ${
                activeTab === l.tab
                  ? 'border-action text-navy font-semibold'
                  : 'border-transparent text-slate-600 hover:text-navy'
              }`}
            >
              {l.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            className="bg-slate-100 hover:bg-slate-200 text-navy px-3.5 py-1.5 rounded-full text-xs font-bold border border-slate-200 transition-colors"
          >
            {language === 'en' ? 'தமிழ்' : 'English'}
          </button>

          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-full text-slate-600 hover:text-navy hover:bg-slate-100 relative transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                  <span className="font-semibold text-sm text-navy">
                    {language === 'ta' ? 'அறிவிப்புகள்' : 'Live Notifications'}
                  </span>
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
                        className={`p-3 text-left hover:bg-slate-50 cursor-pointer ${!n.read ? 'bg-blue-50/60' : ''}`}
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
                          <span className="text-[10px] text-blue-700 font-mono font-semibold">{n.grievanceId}</span>
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

          {user ? (
            <button
              onClick={logout}
              className="hidden sm:flex items-center space-x-2 bg-navy hover:bg-navy-dark text-white px-4 py-2 rounded-full text-xs font-semibold shadow-md transition-colors"
            >
              <img src={user.photoURL || ''} alt="" className="w-5 h-5 rounded-full bg-slate-600" />
              <span>Logout</span>
            </button>
          ) : (
            <button
              onClick={login}
              className="hidden sm:flex items-center space-x-1.5 bg-navy hover:bg-navy-dark text-white px-5 py-2 rounded-full text-xs font-semibold shadow-md transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Login</span>
            </button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {links.map((l) => (
            <button
              key={l.tab}
              onClick={() => go(l.tab, l.role)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                activeTab === l.tab ? 'bg-sky-tint text-navy font-semibold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {l.label}
            </button>
          ))}
          {!user && (
            <button
              onClick={login}
              className="w-full mt-2 bg-navy text-white px-4 py-2.5 rounded-full text-sm font-semibold"
            >
              Login
            </button>
          )}
        </div>
      )}
    </header>
  );
};
