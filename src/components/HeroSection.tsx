import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Mic,
  FileText,
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

/**
 * The hero uses a real, reusable Fort St. George photograph from Wikimedia Commons.
 * The source is public domain, so the site can use it without inventing an AI image.
 */
const HERO_BG_SRC =
  'https://upload.wikimedia.org/wikipedia/commons/b/b0/Fort_St._George%2C_Chennai_2.jpg';
const HERO_BG_FALLBACK = '/og-image.png';

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenVoiceModal,
  onSelectCategory,
}) => {
  const { language, t, setActiveTab } = useApp();

  const civicDepartments = [
    {
      title: language === 'ta' ? 'தெருவிளக்குகள்' : 'Street Lighting',
      icon: Lightbulb,
      category: 'Street Light',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      desc: language === 'ta' ? 'பழுதடைந்த விளக்குகள், மின் கம்பங்கள்' : 'Broken or non-working street lights',
    },
    {
      title: language === 'ta' ? 'குடிநீர் & கழிவுநீர்' : 'Water & Drainage',
      icon: Droplets,
      category: 'Water Supply',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      desc: language === 'ta' ? 'குழாய் உடைப்பு, கழிவுநீர் அடைப்பு' : 'Water supply, leaks and drainage',
    },
    {
      title: language === 'ta' ? 'மின்சார பாதுகாப்பு' : 'Electricity',
      icon: Zap,
      category: 'Electricity & Power',
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      desc: language === 'ta' ? 'மின்சார கோளாறுகள் மற்றும் அபாயங்கள்' : 'Power faults, cables and electrical hazards',
    },
    {
      title: language === 'ta' ? 'சாலை & பள்ளங்கள்' : 'Roads & Potholes',
      icon: Construction,
      category: 'Roads & Potholes',
      color: 'bg-orange-50 text-orange-700 border-orange-200',
      desc: language === 'ta' ? 'சாலை பள்ளம் மற்றும் சேதம்' : 'Potholes, damaged roads and footpaths',
    },
    {
      title: language === 'ta' ? 'திடக்கழிவு & தூய்மை' : 'Sanitation & Waste',
      icon: Trash2,
      category: 'Sanitation & Drainage',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      desc: language === 'ta' ? 'குப்பை தேக்கம் மற்றும் தூய்மை' : 'Uncollected waste and sanitation issues',
    },
    {
      title: language === 'ta' ? 'பொது சுகாதாரம்' : 'Public Health',
      icon: HeartPulse,
      category: 'Public Health & Fogging',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      desc: language === 'ta' ? 'கொசு ஒழிப்பு மற்றும் பொது சுகாதாரம்' : 'Mosquito control and civic health requests',
    },
  ];

  return (
    <div className="hero-root space-y-8">
      <section className="hero-card relative isolate overflow-hidden rounded-2xl bg-slate-950 text-slate-900 px-6 pb-8 sm:px-10 lg:px-12 shadow-xl border border-white/10 flex flex-col justify-center">
        <div aria-hidden="true" className="hero-par-bg absolute inset-0 pointer-events-none">
          <img
            src={HERO_BG_SRC}
            alt=""
            decoding="async"
            fetchPriority="high"
            onError={(event) => {
              const image = event.currentTarget;
              if (!image.src.endsWith(HERO_BG_FALLBACK)) image.src = HERO_BG_FALLBACK;
            }}
            className="h-full w-full object-cover"
            style={{ objectPosition: '50% 42%' }}
          />
        </div>
        <div aria-hidden="true" className="hero-scrim absolute inset-0 pointer-events-none" />

        <div className="hero-reference-layout relative z-10 w-full max-w-7xl mx-auto">
          <div className="hero-reference-copy">
            <p className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              {language === 'ta' ? t.heroBadge : 'CITIZEN GRIEVANCE SERVICE'}
            </p>

            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] font-black tracking-tight text-slate-950 leading-[1.05] ">
              {language === 'ta' ? (
                t.heroHeadline
              ) : (
                <>
                  Report a civic issue.
                  <br />
                  <span>Track what happens next.</span>
                </>
              )}
            </h1>

            <p className="mt-5 max-w-xl text-sm sm:text-base lg:text-lg text-white/90 leading-relaxed ">
              {language === 'ta'
                ? t.heroSubheadline
                : 'Submit a complaint with evidence, review the AI classification, and track the recorded status updates.'}
            </p>

            <div className="mt-6 w-full max-w-2xl">
              <div className="hero-complaint-bar">
                <div className="hero-complaint-icon" aria-hidden="true">
                  <FileText className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className="hero-complaint-placeholder text-left"
                >
                  {language === 'ta'
                    ? 'உங்கள் பிரச்சினையை விவரிக்கவும்...'
                    : 'Describe your civic issue...'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className="hero-complaint-button"
                >
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  <span>{language === 'ta' ? t.btnWriteComplaint : 'File Complaint'}</span>
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onOpenVoiceModal}
                  className="hero-secondary-button"
                >
                  <Mic className="w-4 h-4" aria-hidden="true" />
                  {language === 'ta' ? 'குரலில் பதிவு செய்க' : 'Use voice'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('track')}
                  className="hero-secondary-button"
                >
                  {language === 'ta' ? 'புகாரை கண்காணிக்க' : 'Track a grievance'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 mt-auto pt-5 text-center text-[11px] text-slate-500">
          {language === 'ta'
            ? 'புகைப்படம்: Fort St. George, Chennai — Wikimedia Commons'
            : 'Photo: Fort St. George, Chennai — Wikimedia Commons (public domain)'}
        </p>
      </section>

      <section aria-labelledby="civic-services-title" className="bg-white border border-slate-200 p-6 sm:p-8">
        <div className="mb-6">
          <h2 id="civic-services-title" className="text-xl sm:text-2xl font-black text-slate-900">
            {language === 'ta' ? 'குடிமக்கள் சேவை வகைகள்' : 'Civic service categories'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {language === 'ta'
              ? 'AI ஒரு வகையைப் பரிந்துரைக்கும்; சமர்ப்பிக்கும் முன் அதை நீங்கள் சரிபார்த்து மாற்றலாம்.'
              : 'AI can suggest a category. Review it before submitting your grievance.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {civicDepartments.map((dept) => {
            const Icon = dept.icon;
            return (
              <button
                key={dept.category}
                type="button"
                onClick={() => {
                  onSelectCategory(dept.category);
                  setActiveTab('file');
                }}
                className="bg-white p-5 rounded-lg border border-slate-200 hover:border-slate-400 shadow-sm transition-colors text-left group flex flex-col justify-between"
              >
                <span className="flex items-start gap-3.5">
                  <span className={`p-3 rounded-lg border ${dept.color}`}>
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-bold text-slate-900 text-sm group-hover:text-slate-900">
                      {dept.title}
                    </span>
                    <span className="block text-xs text-slate-600 mt-1">{dept.desc}</span>
                  </span>
                </span>
                <span className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                    {language === 'ta' ? 'புகார் அளிக்க' : 'File complaint'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500" aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="how-it-works-title" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <h2 id="how-it-works-title" className="text-base sm:text-lg font-black text-slate-900 text-center mb-6">
          {language === 'ta' ? 'புகார் செயல்முறை' : 'How a grievance moves through the system'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['01', 'Submit', 'Describe the issue and provide the required contact and location details.'],
            ['02', 'AI review', 'AI suggests a category, department and priority for your review.'],
            ['03', 'Operator action', 'An authorized service operator records assignment and status changes.'],
            ['04', 'Track', 'Use your grievance ID to view the recorded status and resolution details.'],
          ].map(([number, title, description]) => (
            <div key={number} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="inline-flex min-w-8 h-8 px-2 items-center justify-center bg-slate-800 text-white font-mono font-bold text-xs rounded-md">
                {number}
              </span>
              <h3 className="font-bold text-slate-900 text-sm mt-3">{title}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
