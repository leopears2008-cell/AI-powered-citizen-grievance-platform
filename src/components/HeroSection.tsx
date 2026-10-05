import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useHeroHeaderGlass, useHeroParallax } from '../lib/heroMotion';
import {
  Mic,
  FileText,
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
const HERO_BG_SRC = 'https://i0.wp.com/www.tusktravel.com/blog/wp-content/uploads/2023/07/Secretariat-inside-Fort-St-George-Chennai.jpg?resize=1024%2C463&ssl=1';
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
  const { language, t, setActiveTab, showToast } = useApp();
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useHeroHeaderGlass(rootRef);
  useHeroParallax(cardRef);

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

        {/* Layer 3: screenshot-matched hero composition */}
        <div className="hero-reference-layout relative z-10 w-full max-w-7xl mx-auto">
          <div className="hero-reference-copy">
            <p className="hero-rise inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-white/90" style={delay('0.2s')}>
              {language === 'ta' ? t.heroBadge : 'TAMIL NADU GOVERNMENT'}
            </p>

            <h1
              className="hero-rise-blur mt-4 text-4xl sm:text-5xl lg:text-6xl xl:text-[4.5rem] font-black tracking-tight text-white leading-[1.04] [text-shadow:0_3px_22px_rgb(0_0_0/0.42)]"
              style={delay('0.35s')}
            >
              {language === 'ta' ? (
                t.heroHeadline
              ) : (
                <>
                  Your Voice Matters
                  <br />
                  <span>We Listen, We Act</span>
                </>
              )}
            </h1>

            <p
              className="hero-rise mt-5 max-w-xl text-sm sm:text-base lg:text-lg text-white/90 leading-relaxed [text-shadow:0_2px_10px_rgb(0_0_0/0.35)]"
              style={delay('0.55s')}
            >
              {language === 'ta'
                ? t.heroSubheadline
                : 'File your grievances, track status, and help build a better Tamil Nadu — together.'}
            </p>

            <div className="hero-rise mt-6 w-full max-w-2xl" style={delay('0.75s')}>
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
                    ? 'உங்கள் புகாரை விவரிக்கவும்...'
                    : 'Describe your issue... (e.g., water supply, roads, education)'}
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
            </div>
          </div>
        </div>

        {/* Layer 4: screenshot-matched floating actions */}
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className="hero-explore hero-rise"
          style={delay('1.1s')}
        >
          <span className="hero-explore-play" aria-hidden="true">
            <ChevronRight className="w-4 h-4" />
          </span>
          <span>{language === 'ta' ? 'தமிழ்நாட்டை அறிக' : 'Explore Tamil Nadu'}</span>
        </button>

        <div className="hero-assistant hero-pop" style={delay('1.25s')}>
          <div className="hero-float">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 shrink-0 rounded-full bg-sky-100 flex items-center justify-center shadow-sm">
                <Bot className="w-6 h-6 text-sky-700" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">AI Assistant</p>
                <p className="text-xs text-slate-500 leading-snug">
                  {language === 'ta' ? 'உதவி அல்லது புகார் அளிக்க வழிகாட்டுகிறேன்.' : 'Need help? I can guide you or file a complaint for you.'}
                </p>
              </div>
              <button
                type="button"
                onClick={openAssistant}
                aria-label="Open AI Assistant"
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <p className="relative z-10 mt-auto pt-5 text-center text-[11px] text-white/65">
          {language === 'ta' ? 'குடிமக்களின் குரல் • நிவாரணAI' : 'Citizen voice • NivaranAI'}
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
