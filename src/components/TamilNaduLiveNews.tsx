import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { NEWS_CATEGORIES, NewsCategory, NewsItem, NewsResponse } from '../types';
import { AlertTriangle, ArrowRight, Clock, ExternalLink, Newspaper, RefreshCw } from 'lucide-react';

interface Props {
  /** "home" shows a compact 6-headline block; "page" shows the full 12-headline view. */
  variant?: 'home' | 'page';
}

const LABELS: Record<NewsCategory, { en: string; ta: string }> = {
  breaking: { en: 'Breaking News', ta: 'முக்கிய செய்திகள்' },
  government: { en: 'TN Government', ta: 'தமிழ்நாடு அரசு' },
  education: { en: 'Education', ta: 'கல்வி' },
  'public-services': { en: 'Public Services', ta: 'பொது சேவைகள்' },
  transport: { en: 'Transport', ta: 'போக்குவரத்து' },
};

const REFRESH_MS = 10 * 60 * 1000;

// Defence in depth: the server already validates links, but never render a non-https URL.
const isSafeUrl = (u: string) => {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
};

const locale = (lang: 'en' | 'ta') => (lang === 'ta' ? 'ta-IN' : 'en-IN');

function relativeTime(iso: string, lang: 'en' | 'ta'): string {
  const diffMs = Date.parse(iso) - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto' });
  const mins = Math.round(diffMs / 60000);
  if (Math.abs(mins) < 60) return rtf.format(Math.min(mins, 0), 'minute');
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
  return rtf.format(Math.round(hours / 24), 'day');
}

function fullTime(iso: string, lang: 'en' | 'ta'): string {
  return new Intl.DateTimeFormat(locale(lang), { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(
    new Date(iso),
  );
}

const NewsCard: React.FC<{ item: NewsItem; lang: 'en' | 'ta' }> = ({ item, lang }) => (
  <li>
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      aria-label={`${item.title} — ${item.source}. ${lang === 'ta' ? 'புதிய தாவலில் திறக்கும்' : 'Opens in a new tab'}`}
      className="group h-full bg-white rounded-2xl border border-slate-200 shadow-card p-5 flex flex-col gap-3 transition-all hover:shadow-md hover:border-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
    >
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="font-bold text-action bg-sky-tint px-2.5 py-1 rounded-full truncate max-w-[60%]">{item.source}</span>
        {item.publishedAt && (
          <time dateTime={item.publishedAt} title={fullTime(item.publishedAt, lang)} className="inline-flex items-center gap-1 text-slate-500 shrink-0">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            {relativeTime(item.publishedAt, lang)}
          </time>
        )}
      </div>
      <h3 className="font-bold text-navy text-sm leading-snug line-clamp-4 flex-1">{item.title}</h3>
      <span className="text-xs font-semibold text-action inline-flex items-center gap-1">
        {lang === 'ta' ? 'செய்தியைப் படிக்க' : 'Read full story'}
        <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
      </span>
    </a>
  </li>
);

const Skeleton: React.FC<{ count: number }> = ({ count }) => (
  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <li key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 motion-safe:animate-pulse">
        <div className="h-5 w-1/3 rounded-full bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-5/6 rounded bg-slate-200" />
        <div className="h-4 w-2/3 rounded bg-slate-200" />
      </li>
    ))}
  </ul>
);

export const TamilNaduLiveNews: React.FC<Props> = ({ variant = 'home' }) => {
  const { language, setActiveTab } = useApp();
  const lang: 'en' | 'ta' = language === 'ta' ? 'ta' : 'en';
  const limit = variant === 'home' ? 6 : 12;

  const [category, setCategory] = useState<NewsCategory>('breaking');
  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api
      .getTamilNaduNews(category, lang, limit, controller.signal)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Live news is temporarily unavailable.');
        setLoading(false);
      });
    return () => controller.abort();
  }, [category, lang, limit, reloadKey]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') setReloadKey((k) => k + 1);
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);

  const onTabKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const last = NEWS_CATEGORIES.length - 1;
    let next = index;
    if (e.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    else if (e.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else return;
    e.preventDefault();
    setCategory(NEWS_CATEGORIES[next]);
    tabRefs.current[NEWS_CATEGORIES[next]]?.focus();
  }, []);

  const current = data && data.category === category && data.language === lang ? data : null;
  const items = (current?.items ?? []).filter((i) => isSafeUrl(i.url));
  const showSkeleton = loading && !current;
  const showError = !!error && !current;
  const showEmpty = !loading && !error && current !== null && items.length === 0;
  const Heading = variant === 'page' ? 'h1' : 'h2';

  return (
    <section aria-labelledby={`tn-news-heading-${variant}`} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Heading id={`tn-news-heading-${variant}`} className="text-2xl font-bold text-navy inline-flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-ai" aria-hidden="true" />
              {lang === 'ta' ? 'தமிழ்நாடு நேரலைச் செய்திகள்' : 'Tamil Nadu Live News'}
            </Heading>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-red-700">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 motion-safe:animate-pulse" aria-hidden="true" />
              {lang === 'ta' ? 'நேரலை' : 'Live'}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {lang === 'ta'
              ? 'தமிழ்நாடு குறித்த சமீபத்திய தலைப்புச் செய்திகள் — அசல் வெளியீட்டாளர் இணைப்புகளுடன்.'
              : 'Latest Tamil Nadu headlines from news publishers, linked to the original story.'}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {current && (
            <span>
              {lang === 'ta' ? 'புதுப்பிக்கப்பட்டது' : 'Updated'}{' '}
              <time dateTime={current.fetchedAt}>{fullTime(current.fetchedAt, lang)}</time>
            </span>
          )}
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-navy hover:bg-slate-50 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
            {lang === 'ta' ? 'புதுப்பி' : 'Refresh'}
          </button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label={lang === 'ta' ? 'செய்தி வகைகள்' : 'News categories'}
        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
      >
        {NEWS_CATEGORIES.map((c, i) => {
          const selected = c === category;
          return (
            <button
              key={c}
              ref={(el) => {
                tabRefs.current[c] = el;
              }}
              role="tab"
              id={`tn-news-tab-${variant}-${c}`}
              aria-selected={selected}
              aria-controls={`tn-news-panel-${variant}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setCategory(c)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-navy ${
                selected ? 'bg-navy text-white border-navy' : 'bg-white text-slate-700 border-slate-200 hover:border-navy hover:text-navy'
              }`}
            >
              {LABELS[c][lang]}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`tn-news-panel-${variant}`}
        aria-labelledby={`tn-news-tab-${variant}-${category}`}
        aria-busy={loading}
        aria-live="polite"
        className="space-y-4"
      >
        {current?.stale && (
          <p role="status" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            {lang === 'ta'
              ? 'நேரடி செய்தி ஆதாரம் தற்போது கிடைக்கவில்லை; கடைசியாகப் பெறப்பட்ட தலைப்புச் செய்திகள் காட்டப்படுகின்றன.'
              : 'The live feed is temporarily unreachable. Showing the most recently retrieved headlines.'}
          </p>
        )}

        {showSkeleton && (
          <>
            <span className="sr-only">{lang === 'ta' ? 'செய்திகள் ஏற்றப்படுகின்றன…' : 'Loading headlines…'}</span>
            <Skeleton count={limit} />
          </>
        )}

        {showError && (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" aria-hidden="true" />
            <p className="text-sm font-semibold text-red-900">
              {lang === 'ta' ? 'நேரலைச் செய்திகளை ஏற்ற முடியவில்லை.' : 'We couldn’t load live news right now.'}
            </p>
            <p className="text-xs text-red-800">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-navy-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-navy"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              {lang === 'ta' ? 'மீண்டும் முயற்சி' : 'Try again'}
            </button>
          </div>
        )}

        {showEmpty && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-2">
            <Newspaper className="w-8 h-8 text-slate-300 mx-auto" aria-hidden="true" />
            <p className="text-sm font-semibold text-navy">
              {lang === 'ta' ? 'இந்த வகையில் தற்போது செய்திகள் இல்லை.' : 'No recent headlines in this category.'}
            </p>
            <p className="text-xs text-slate-500">
              {lang === 'ta' ? 'வேறொரு வகையைத் தேர்ந்தெடுக்கவும் அல்லது பிறகு முயற்சிக்கவும்.' : 'Try another category or check back shortly.'}
            </p>
          </div>
        )}

        {!showSkeleton && items.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <NewsCard key={item.id} item={item} lang={lang} />
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px] text-slate-500">
        <p>
          {lang === 'ta'
            ? 'தலைப்புச் செய்திகள் Google News RSS மூலம் பெறப்படுகின்றன. உள்ளடக்கம் அந்தஅந்த வெளியீட்டாளர்களுக்குச் சொந்தம்.'
            : 'Headlines via Google News RSS. Story content belongs to the respective publishers; NivaranAI does not endorse linked articles.'}
        </p>
        {variant === 'home' && (
          <button
            type="button"
            onClick={() => setActiveTab('news')}
            className="inline-flex items-center gap-1 text-xs font-bold text-action hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded"
          >
            {lang === 'ta' ? 'அனைத்துச் செய்திகள்' : 'View all news'}
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
};
