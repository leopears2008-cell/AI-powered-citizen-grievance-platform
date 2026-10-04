import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useHeroHeaderGlass, useHeroParallax } from '../lib/heroMotion';
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
  Compass,
  Bot,
} from 'lucide-react';

interface HeroSectionProps {
  onOpenVoiceModal: () => void;
  onSelectCategory: (category: string) => void;
}

/**
 * Hero photograph: real Fort St. George, Chennai image from Wikimedia Commons.
 * The previous local WebP was invalid/too small and was causing the hero image to
 * disappear on deployed mobile browsers. Keep a local fallback so the hero never
 * becomes an empty/dark panel if the external image is temporarily unavailable.
 * Source: https://commons.wikimedia.org/wiki/File:Fort_St._George,_Chennai_2.jpg
 * License: public domain (author-released).
 */
const HERO_BG_SRC = 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Fort_St._George%2C_Chennai_2.jpg';
const HERO_BG_FALLBACK = '/og-image.png';
/** Optional transparent PNG/WebP of foreground trees. Leave null until the asset exists. */
const HERO_FOREGROUND_SRC = null as string | null;

/** Deterministic pseudo-random dust motes (no layout shift, no re-render churn). */
function makeMotes(count: number) {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: count }, (_, id) => ({
    id,
    x: `${(rnd() * 92 + 4).toFixed(1)}%`,
    y: `${(rnd() * 80 + 10).toFixed(1)}%`,
    s: `${(rnd() * 1.6 + 1.6).toFixed(1)}px`,
    t: `${(rnd() * 12 + 16).toFixed(1)}s`,
    dl: `-${(rnd() * 20).toFixed(1)}s`,
    dx: `${(rnd() * 40 - 20).toFixed(0)}px`,
    dy: `${(rnd() * -50 - 10).toFixed(0)}px`,
  }));
}

const MOTES = makeMotes(12);

const delay = (value: string) => ({ '--d': value }) as React.CSSProperties;

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenVoiceModal,
  onSelectCategory,
}) => {
  const { language, t, setActiveTab, setTrackId, showToast } = useApp();
  const [quickTrackInput, setQuickTrackInput] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useHeroHeaderGlass(rootRef);
  useHeroParallax(cardRef);

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

  /** Scrolls to the existing assistant section on the page; does not touch its logic. */
  const openAssistant = () => {
    const section = document.querySelector<HTMLElement>('[aria-labelledby="grievance-assistant-title"]');
    if (!section) {
      showToast(
        language === 'ta' ? 'உதவியாளர் தற்போது கிடைக்கவில்லை' : 'The assistant is currently unavailable.',
        'warning'
      );
      return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 0;
    const top = section.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
    window.setTimeout(
      () => section.querySelector<HTMLElement>('input, textarea')?.focus({ preventScroll: true }),
      reduce ? 0 : 600
    );
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
    <div ref={rootRef} className="hero-root space-y-12">
      {/* Cinematic hero */}
      <div
        ref={cardRef}
        className="hero-card relative isolate overflow-hidden rounded-2xl bg-slate-950 text-white px-6 pb-8 sm:px-10 lg:px-12 shadow-xl shadow-indigo-100 border border-white/10 flex flex-col justify-center min-h-[38rem] sm:min-h-[40rem] lg:min-h-[40rem]"
      >
        {/* Layer 1: photograph (parallax wrapper > Ken Burns image) */}
        <div aria-hidden="true" className="hero-par-bg absolute -inset-[4%] pointer-events-none">
          <img
            src={HERO_BG_SRC}
            alt=""
            decoding="async"
            fetchPriority="high"
            onError={(event) => {
              const image = event.currentTarget;
              if (image.src !== new URL(HERO_BG_FALLBACK, window.location.href).href) {
                image.src = HERO_BG_FALLBACK;
              }
            }}
            className="hero-kb h-full w-full object-cover"
            style={{ objectPosition: '50% 40%' }}
          />
        </div>

        {/* Layer 2: optional foreground scenery */}
        {HERO_FOREGROUND_SRC && (
          <div aria-hidden="true" className="hero-par-fg absolute -inset-[3%] pointer-events-none">
            <img
              src={HERO_FOREGROUND_SRC}
              alt=""
              decoding="async"
              loading="lazy"
              className="h-full w-full object-cover object-bottom"
            />
          </div>
        )}

        {/* Atmosphere: sunlight, readability scrim, vignette, dust */}
        <div aria-hidden="true" className="hero-light absolute inset-0 pointer-events-none" />
        <div aria-hidden="true" className="hero-scrim absolute inset-0 pointer-events-none" />
        <div aria-hidden="true" className="hero-vignette absolute inset-0 pointer-events-none" />
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
          {MOTES.map((m) => (
            <span
              key={m.id}
              className="hero-mote"
              style={
                {
                  '--x': m.x,
                  '--y': m.y,
                  '--s': m.s,
                  '--t': m.t,
                  '--dl': m.dl,
                  '--dx': m.dx,
                  '--dy': m.dy,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {/* Layer 3: hero text / UI */}
        <div className="hero-par-text relative z-10 w-full max-w-4xl mx-auto text-center space-y-6">
          <div className="hero-rise" style={delay('0.2s')}>
            <p className="inline-flex items-center gap-3 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/90">
              <span aria-hidden="true" className="h-px w-6 sm:w-10 bg-amber-100/50" />
              {language === 'ta' ? t.heroBadge : 'TAMIL NADU GOVERNMENT'}
              <span aria-hidden="true" className="h-px w-6 sm:w-10 bg-amber-100/50" />
            </p>
          </div>

          <h1
            className="hero-rise-blur text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight font-sans text-white leading-[1.08] [text-shadow:0_2px_16px_rgb(0_0_0/0.45)]"
            style={delay('0.4s')}
          >
            {language === 'ta' ? (
              t.heroHeadline
            ) : (
              <>
                Your Voice Matters.
                <br />
                <span className="text-amber-100">We Listen, We Act.</span>
              </>
            )}
          </h1>

          <p
            className="hero-rise text-sm sm:text-base lg:text-lg text-slate-100 max-w-2xl mx-auto leading-relaxed font-normal [text-shadow:0_1px_8px_rgb(0_0_0/0.4)]"
            style={delay('0.6s')}
          >
            {language === 'ta'
              ? t.heroSubheadline
              : 'File your grievances, track status, and help build a better Tamil Nadu — together.'}
          </p>

          {/* Action CTAs */}
          <div
            className="hero-rise flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
            style={delay('0.8s')}
          >
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-indigo-900 font-bold text-sm sm:text-base shadow-lg shadow-black/25 flex items-center justify-center space-x-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <FileText className="w-5 h-5 text-indigo-600" aria-hidden="true" />
              <span>{language === 'ta' ? t.btnWriteComplaint : 'File Complaint'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('directory')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base border border-white/35 backdrop-blur-sm flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Compass className="w-5 h-5 text-amber-100" aria-hidden="true" />
              <span>{language === 'ta' ? 'தமிழ்நாட்டை அறிக' : 'Explore Tamil Nadu'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenVoiceModal}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-transparent hover:bg-white/10 text-white font-semibold text-sm sm:text-base border border-white/20 flex items-center justify-center space-x-2 transition-all"
            >
              <Mic className="w-5 h-5 text-indigo-200" aria-hidden="true" />
              <span>{t.btnSpeakComplaint}</span>
            </button>
          </div>

          {/* Quick Track Input Bar */}
          <div className="hero-rise pt-2 max-w-xl mx-auto" style={delay('1s')}>
            <form
              onSubmit={handleQuickTrack}
              className="bg-slate-900/45 p-1.5 rounded-xl border border-white/20 backdrop-blur-md flex items-center shadow-lg"
            >
              <Search className="w-4 h-4 text-indigo-200 ml-3 shrink-0" aria-hidden="true" />
              <input
                type="text"
                value={quickTrackInput}
                onChange={(e) => setQuickTrackInput(e.target.value)}
                aria-label={language === 'ta' ? 'புகார் எண்' : 'Grievance ID'}
                placeholder={
                  language === 'ta'
                    ? 'புகார் எண் மூலம் நிலை அறிய (எ.கா: GRV-2026-00124)'
                    : 'Track existing grievance (e.g. GRV-2026-00124)'
                }
                className="w-full min-w-0 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-300 focus:outline-none font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors shrink-0 flex items-center space-x-1"
              >
                <span>{language === 'ta' ? 'அறிக' : 'Track'}</span>
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>

        {/* Layer 4: assistant card (parallax > entrance > float) */}
        <div className="hero-par-card relative z-10 mt-8 w-full max-w-xl mx-auto">
          <div className="hero-pop" style={delay('1.2s')}>
            <div className="hero-float">
              <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-slate-900/50 backdrop-blur-md p-3 sm:p-4 text-left shadow-xl shadow-black/20">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Bot className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">NivaranAI Citizen Assistant</p>
                  <p className="text-xs text-slate-200 leading-snug">
                    {language === 'ta'
                      ? 'புகாரை எழுத, செயல்முறையை அறிய உதவும்.'
                      : 'Draft a complaint, learn the process, or find where to track it.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openAssistant}
                  className="shrink-0 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-bold text-white transition-colors"
                >
                  {language === 'ta' ? 'கேளுங்கள்' : 'Ask'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 mt-8 border-t border-white/15 pt-4 text-center text-xs text-slate-200">
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
                : 'AI extracts category, department & urgency priority for review.'}
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
