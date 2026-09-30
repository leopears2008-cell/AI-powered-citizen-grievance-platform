import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mic,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  ThumbsUp,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Droplets,
  Zap,
  Construction,
  Trash2,
  Lightbulb,
  HeartPulse,
  ChevronRight,
} from 'lucide-react';

interface HeroSectionProps {
  onOpenVoiceModal: () => void;
  onSelectCategory: (category: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenVoiceModal,
  onSelectCategory,
}) => {
  const { language, t, setActiveTab, setTrackId, showToast } = useApp();
  const [quickTrackInput, setQuickTrackInput] = useState('');

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTrackInput.trim()) {
      showToast(
        language === 'ta' ? 'புகார் கண்காணிப்பு எண்ணை உள்ளிடவும்' : 'Please enter Grievance ID',
        'warning'
      );
      return;
    }
    setTrackId(quickTrackInput.trim().toUpperCase());
    setActiveTab('track');
  };

  const civicDepartments = [
    {
      title: language === 'ta' ? 'தெருவிளக்குகள்' : 'Street Lighting',
      icon: Lightbulb,
      category: 'Street Light',
      color: 'bg-amber-500/10 text-amber-600 border-amber-200',
      desc: language === 'ta' ? 'பழுதடைந்த விளக்குகள், மின் கம்பங்கள்' : 'Dark streets, broken luminaires',
    },
    {
      title: language === 'ta' ? 'குடிநீர் & கழிவுநீர்' : 'Water & Drainage',
      icon: Droplets,
      category: 'Water Supply',
      color: 'bg-blue-500/10 text-blue-600 border-blue-200',
      desc: language === 'ta' ? 'குழாய் உடைப்பு, கழிவுநீர் அடைப்பு' : 'Pipe leaks, contamination, sewage',
    },
    {
      title: language === 'ta' ? 'மின்சார பாதுகாப்பு' : 'Electricity Board',
      icon: Zap,
      category: 'Electricity & Power',
      color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
      desc: language === 'ta' ? 'திறந்த மின் கம்பிகள், மின்மாற்றி' : 'TNEB power cuts, sparks, cables',
    },
    {
      title: language === 'ta' ? 'சாலை & பள்ளங்கள்' : 'Roads & Potholes',
      icon: Construction,
      category: 'Roads & Potholes',
      color: 'bg-orange-500/10 text-orange-600 border-orange-200',
      desc: language === 'ta' ? 'சாலை பள்ளம், சேதமடைந்த தார்' : 'Tar damage, cave-ins, footpaths',
    },
    {
      title: language === 'ta' ? 'திடக்கழிவு & தூய்மை' : 'Sanitation & Waste',
      icon: Trash2,
      category: 'Sanitation & Drainage',
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
      desc: language === 'ta' ? 'குப்பை தேக்கம், துர்நாற்றம்' : 'Uncollected waste, overflowing bins',
    },
    {
      title: language === 'ta' ? 'பொது சுகாதாரம்' : 'Public Health',
      icon: HeartPulse,
      category: 'Public Health & Fogging',
      color: 'bg-rose-500/10 text-rose-600 border-rose-200',
      desc: language === 'ta' ? 'கொசு ஒழிப்பு, டெங்கு தடுப்பு' : 'Mosquito fogging, epidemic alert',
    },
  ];

  return (
    <div className="space-y-12">
      {/* Primary Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-indigo-900 text-white p-6 sm:p-10 lg:p-12 shadow-xl shadow-indigo-100 border border-indigo-800">
        {/* Background Subtle Geometric Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-800/50 text-indigo-200 border border-indigo-700/50 text-xs font-semibold tracking-wide backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
            <span>{t.heroBadge}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-indigo-300 font-normal">
              {language === 'ta' ? 'நிகழ்நேர AI சேவை' : 'Tamil & English Voice Enabled'}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight font-sans text-white leading-tight">
            {t.heroHeadline}
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            {t.heroSubheadline}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {/* Primary Voice Action Button */}
            <button
              onClick={onOpenVoiceModal}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-indigo-900 font-bold text-sm sm:text-base shadow-lg shadow-indigo-900/30 flex items-center justify-center space-x-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Mic className="w-5 h-5 text-indigo-600 animate-bounce" />
              <span>{t.btnSpeakComplaint}</span>
            </button>

            {/* Secondary Type Action Button */}
            <button
              onClick={() => setActiveTab('file')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base border border-indigo-700 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <FileText className="w-5 h-5 text-indigo-300" />
              <span>{t.btnWriteComplaint}</span>
            </button>
          </div>

          {/* Quick Track Input Bar */}
          <div className="pt-4 max-w-xl mx-auto">
            <form
              onSubmit={handleQuickTrack}
              className="bg-indigo-800/40 p-1.5 rounded-xl border border-indigo-700 backdrop-blur-md flex items-center shadow-lg"
            >
              <Search className="w-4 h-4 text-indigo-300 ml-3 shrink-0" />
              <input
                type="text"
                value={quickTrackInput}
                onChange={(e) => setQuickTrackInput(e.target.value)}
                placeholder={
                  language === 'ta'
                    ? 'புகார் எண் மூலம் நிலை அறிய (எ.கா: GRV-2026-00124)'
                    : 'Track existing grievance (e.g. GRV-2026-00124)'
                }
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-indigo-300 focus:outline-none font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors shrink-0 flex items-center space-x-1"
              >
                <span>{language === 'ta' ? 'அறிக' : 'Track'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        <p className="relative z-10 mt-10 border-t border-indigo-800 pt-5 text-center text-xs text-indigo-200">
          {language === 'ta'
            ? 'இது முன்-உற்பத்தி தளம். உண்மையான புகார் சேவை அல்லது செயல்பாட்டு புள்ளிவிவரங்கள் உறுதிப்படுத்தப்படவில்லை.'
            : 'Pre-production interface. No live complaint service or operational metrics are claimed.'}
        </p>
      </div>

      {/* Core Civic Service Categories Section */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-sans">
              {language === 'ta' ? 'குடிமக்கள் சேவை வகைகள்' : 'Civic service categories'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {language === 'ta'
                ? 'AI வகைப்பாட்டை பரிந்துரைக்கும்; உண்மையான ஒதுக்கீடும் நிலை புதுப்பிப்புகளும் சேவை இயக்குநர் அமைப்பைப் பொறுத்தது.'
                : 'AI suggests a category. Any real assignment or status update depends on the configured service operator.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {civicDepartments.map((dept) => {
            const Icon = dept.icon;
            return (
              <div
                key={dept.category}
                onClick={() => {
                  onSelectCategory(dept.category);
                  setActiveTab('file');
                }}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-200 shadow-sm hover:shadow-md transition-colors cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start space-x-3.5">
                  <div className={`p-3 rounded-xl border ${dept.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
                      {dept.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{dept.desc}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {language === 'ta' ? 'புகார் அளிக்க' : 'File Complaint'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How It Works Infographic Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8">
        <h3 className="text-base sm:text-lg font-black text-slate-900 text-center mb-6">
          {language === 'ta'
            ? 'நிவாரன்AI எவ்வாறு செயல்படுகிறது? (4 எளிய படிகள்)'
            : 'How NivaranAI Resolves Citizen Grievances in 4 Steps'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 relative">
            <span className="absolute -top-3 left-4 bg-blue-700 text-white font-mono font-bold text-xs px-2 py-0.5 rounded-full">
              01
            </span>
            <h4 className="font-bold text-slate-900 text-sm mt-1">
              {language === 'ta' ? 'குரல் / உரை பதிவு' : 'Voice / Text Input'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {language === 'ta'
                ? 'தமிழ் அல்லது ஆங்கிலத்தில் உங்கள் குறையை குரல் மூலம் பேசவும்.'
                : 'Speak in Tamil or English naturally via microphone or type details.'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 relative">
            <span className="absolute -top-3 left-4 bg-indigo-700 text-white font-mono font-bold text-xs px-2 py-0.5 rounded-full">
              02
            </span>
            <h4 className="font-bold text-slate-900 text-sm mt-1">
              {language === 'ta' ? 'AI வகைப்பாடு & உறுதி' : 'AI Classification'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {language === 'ta'
                ? 'துறை, முன்னுரிமை ஆகியவற்றை AI ஆராய்ந்து உங்கள் ஒப்புதலைக் கேட்கும்.'
                : 'Gemini AI extracts category, department & urgency priority for review.'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 relative">
            <span className="absolute -top-3 left-4 bg-amber-600 text-white font-mono font-bold text-xs px-2 py-0.5 rounded-full">
              03
            </span>
            <h4 className="font-bold text-slate-900 text-sm mt-1">
              {language === 'ta' ? 'இயக்குநர் ஆய்வு' : 'Operator review'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {language === 'ta'
                ? 'இந்த முன்-உற்பத்தி பயன்பாட்டில் உண்மையான அதிகாரி ஒதுக்கீடு அமைக்கப்படவில்லை.'
                : 'This pre-production app does not have a live officer assignment configured.'}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 relative">
            <span className="absolute -top-3 left-4 bg-emerald-700 text-white font-mono font-bold text-xs px-2 py-0.5 rounded-full">
              04
            </span>
            <h4 className="font-bold text-slate-900 text-sm mt-1">
              {language === 'ta' ? 'நிலைப் புதுப்பிப்பு & கருத்து' : 'Status update and feedback'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {language === 'ta'
                ? 'இயக்குநர் நிலையைப் புதுப்பித்தால், குடிமக்கள் கருத்து வழங்கலாம்.'
                : 'Citizens can leave feedback after an operator records a resolution.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
