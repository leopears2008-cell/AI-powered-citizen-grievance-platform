import React from 'react';
import { useApp } from '../context/AppContext';
import { Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const { language, t, setActiveTab, setRole } = useApp();
  const open = (tab: string, role: 'CITIZEN' | 'OFFICER' | 'ADMIN' = 'CITIZEN') => {
    setRole(role);
    setActiveTab(tab as never);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const link = 'text-left text-slate-300 hover:text-white transition-colors';

  return (
    <footer className="bg-navy-dark text-slate-300 text-sm mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-full bg-white/10 border-2 border-emerald-400 flex items-center justify-center text-white font-bold">
              TN
            </div>
            <div className="text-xl font-extrabold text-white">
              Nivaran<span className="text-ai">AI</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {language === 'ta'
              ? 'AI சார்ந்த குடிமக்கள் குறைதீர்ப்பு தளம் • தமிழ்நாடு அரசு'
              : 'AI-Powered Citizen Grievance Platform. Government of Tamil Nadu.'}
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold mb-3">Quick Links</h4>
          <ul className="space-y-2">
            <li><button className={link} onClick={() => open('home')}>{t.navHome}</button></li>
            <li><button className={link} onClick={() => open('file')}>{t.navFileComplaint}</button></li>
            <li><button className={link} onClick={() => open('track')}>{t.navTrack}</button></li>
            <li><button className={link} onClick={() => open('history')}>{t.navHistory}</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-3">Departments</h4>
          <ul className="space-y-2">
            <li><button className={link} onClick={() => open('directory')}>{t.navDirectory}</button></li>
            <li><button className={link} onClick={() => open('analytics')}>{t.navAnalytics}</button></li>
            <li><button className={link} onClick={() => open('officer', 'OFFICER')}>{t.roleOfficer}</button></li>
            <li><button className={link} onClick={() => open('admin', 'ADMIN')}>{t.roleAdmin}</button></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-3">Contact Us</h4>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center space-x-2"><Phone className="w-4 h-4 text-ai" /><span>CM Helpline: 1100 (Toll Free)</span></li>
            <li className="flex items-center space-x-2"><Phone className="w-4 h-4 text-ai" /><span>Chennai GCC: 1913</span></li>
            <li className="flex items-center space-x-2"><Mail className="w-4 h-4 text-ai" /><span>support@nivaranai.tn.gov.in</span></li>
            <li className="flex items-center space-x-2"><MapPin className="w-4 h-4 text-ai" /><span>Chennai, Tamil Nadu</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-400">
          <p>© 2026 NivaranAI. All rights reserved. | Government of Tamil Nadu</p>
          <p>Privacy Policy | Terms of Service | Accessibility</p>
        </div>
      </div>
    </footer>
  );
};
