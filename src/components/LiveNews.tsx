import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Newspaper, RefreshCw, Search, Radio } from 'lucide-react';
import { fetchWikinews, googleNewsUrl, type WikinewsArticle } from '../services/wikimedia';

interface LiveNewsProps {
  initialQuery?: string;
  compact?: boolean;
  title?: string;
}

export const LiveNews: React.FC<LiveNewsProps> = ({
  initialQuery = 'Tamil Nadu',
  compact = false,
  title = 'Live News',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [articles, setArticles] = useState<WikinewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const externalNewsUrl = useMemo(() => googleNewsUrl(query), [query]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchWikinews(query, compact ? 6 : 12)
      .then((items) => {
        if (!cancelled) setArticles(items);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, compact, refreshNonce]);

  const runSearch = (value: string) => {
    const next = value.trim();
    if (next) setQuery(next);
  };

  return (
    <section className={compact ? 'space-y-4' : 'max-w-7xl mx-auto space-y-6'}>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                <p className="text-[11px] text-slate-500">
                  Wikimedia/Wikinews search · refreshes on demand
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {['Tamil Nadu', 'Chennai', 'Civic issues'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setQuery(preset)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                {preset}
              </button>
            ))}
            <a
              href={externalNewsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            >
              More live coverage <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const input = event.currentTarget.elements.namedItem('news-query') as HTMLInputElement | null;
            runSearch(input?.value || query);
          }}
          className="mt-5 flex flex-col sm:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              name="news-query"
              defaultValue={query}
              aria-label="Search live news"
              placeholder="Search Tamil Nadu, a constituency, MLA, or civic issue"
              className="w-full pl-11 pr-4 p-3 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
          >
            <Search className="w-4 h-4" /> Search
          </button>
          <button
            type="button"
            onClick={() => setRefreshNonce((value) => value + 1)}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
            title="Refresh"
            aria-label="Refresh live news"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Search: <span className="font-semibold text-slate-800">{query}</span>
          </div>
          <div className="text-[10px] text-slate-400">
            News attribution: Wikinews. Wikipedia is used separately for MLA profile metadata.
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Loading live news…
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <Newspaper className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-800">No Wikinews articles matched this search.</p>
          <p className="text-xs text-slate-500 mt-1">
            Try a broader search, or open the external live-coverage link above.
          </p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${compact ? '' : 'md:grid-cols-2 xl:grid-cols-3'} gap-4`}>
          {articles.map((article) => (
            <article key={`${article.url}-${article.title}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {article.imageUrl && (
                <img
                  src={article.imageUrl}
                  alt=""
                  loading="lazy"
                  className="w-full h-40 object-cover bg-slate-100"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="p-5">
                <div className="text-[10px] uppercase tracking-wide font-bold text-red-600 mb-2">
                  Wikinews
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{article.title}</h3>
                {article.extract && (
                  <p className="text-xs text-slate-600 leading-relaxed mt-2 line-clamp-4">
                    {article.extract}
                  </p>
                )}
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                >
                  Read on Wikinews <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
