import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getAvailableDistricts, getAllMLAs, getDataSourceInfo, type MLAProfile } from '../data/mlaProfiles';
import { findWikipediaProfile, type WikipediaProfile } from '../services/wikimedia';
import { LiveNews } from './LiveNews';
import {
  Search,
  MapPin,
  Building2,
  User,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from 'lucide-react';

const PAGE_SIZE = 12;

export const MLADirectory: React.FC = () => {
  const { language } = useApp();
  const districts = useMemo(() => getAvailableDistricts(), []);
  const allMLAs = useMemo(() => getAllMLAs(), []);
  const dataSource = useMemo(() => getDataSourceInfo(), []);

  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [wikiProfiles, setWikiProfiles] = useState<Record<string, WikipediaProfile | null>>({});
  const [selectedMLA, setSelectedMLA] = useState<MLAProfile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<WikipediaProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const filteredMLAs = useMemo(() => {
    let filtered = selectedDistrict === 'All Districts'
      ? allMLAs
      : allMLAs.filter((m) => m.district === selectedDistrict);

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.constituency.toLowerCase().includes(query) ||
          m.party.toLowerCase().includes(query) ||
          m.district.toLowerCase().includes(query),
      );
    }

    return [...filtered].sort((a, b) => a.constituencyNumber - b.constituencyNumber);
  }, [selectedDistrict, searchQuery, allMLAs]);

  const totalPages = Math.max(1, Math.ceil(filteredMLAs.length / PAGE_SIZE));
  const visibleMLAs = useMemo(
    () => filteredMLAs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredMLAs, page],
  );

  useEffect(() => {
    setPage(1);
  }, [selectedDistrict, searchQuery]);

  useEffect(() => {
    let cancelled = false;
    const loadProfiles = async () => {
      const candidates = visibleMLAs
        .filter((mla) => mla.status !== 'Vacant' && wikiProfiles[mla.name] === undefined)
        .slice(0, PAGE_SIZE);

      if (candidates.length === 0) return;

      const results = await Promise.all(
        candidates.map(async (mla) => [mla.name, await findWikipediaProfile(mla.name)] as const),
      );

      if (cancelled) return;

      setWikiProfiles((current) => {
        const next = { ...current };
        for (const [name, profile] of results) next[name] = profile;
        return next;
      });
    };

    void loadProfiles();
    return () => {
      cancelled = true;
    };
  }, [visibleMLAs, wikiProfiles]);

  const openProfile = async (mla: MLAProfile) => {
    setSelectedMLA(mla);
    setSelectedProfile(wikiProfiles[mla.name] ?? null);

    if (mla.status === 'Vacant' || wikiProfiles[mla.name]) return;

    setProfileLoading(true);
    const profile = await findWikipediaProfile(mla.name);
    setProfileLoading(false);
    setSelectedProfile(profile);
    setWikiProfiles((current) => ({ ...current, [mla.name]: profile }));
  };

  const closeProfile = () => {
    setSelectedMLA(null);
    setSelectedProfile(null);
    setProfileLoading(false);
  };

  const selectedNewsQuery = selectedMLA
    ? `"${selectedMLA.constituency}" "${selectedMLA.district}" Tamil Nadu`
    : 'Tamil Nadu';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <h2 className="text-xl font-bold text-slate-900">
            {language === 'ta' ? 'தமிழ்நாடு 2026 சட்டமன்றத் தேர்தல் முடிவுகள்' : 'Tamil Nadu 2026 Assembly election results'}
          </h2>
          <a
            href={dataSource.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full hover:bg-emerald-100 transition-colors"
          >
            <span>Snapshot compiled · {dataSource.snapshotCompiledAt}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <p className="text-sm text-slate-500 mb-2">
          {language === 'ta'
            ? 'இது 2026 தேர்தல் முடிவுகளின் வரலாற்றுப் பதிவு; தற்போதைய உறுப்பினர் பட்டியல் அல்ல. நடப்பு விவரங்களை அதிகாரப்பூர்வ பதிவுகளில் சரிபார்க்கவும்.'
            : 'Search the 2026 election result records or filter by district. This is a historical election snapshot, not a live or verified list of current officeholders.'}
        </p>

        <p className="text-[11px] text-slate-400 mb-8">
          Snapshot source: {dataSource.sourceName}. {dataSource.asOfNote}. Vacancy notes reflect the source snapshot and may have changed. Check the{' '}
          <a
            className="underline focus-visible:outline focus-visible:outline-2"
            href="https://results.eci.gov.in/ResultAcGenMay2026/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Election Commission of India 2026 results
          </a>{' '}
          and current Assembly records before relying on any entry.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div>
            <label htmlFor="district-filter" className="text-xs font-semibold text-slate-600 block mb-1.5">
              {language === 'ta' ? 'மாவட்டம்' : 'Filter by District'}
            </label>
            <select
              id="district-filter"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full p-3 text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-slate-50 font-medium"
            >
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d === 'All Districts' && language === 'ta' ? 'அனைத்து மாவட்டங்களும்' : d}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 relative">
            <label htmlFor="mla-search" className="text-xs font-semibold text-slate-600 block mb-1.5">
              {language === 'ta' ? 'தேடல்' : 'Search MLA, constituency, district...'}
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                id="mla-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ta' ? 'தொகுதி அல்லது உறுப்பினர் பெயர்...' : 'Search by MLA name, constituency, district, or party...'}
                className="w-full pl-11 p-3 text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-slate-50"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 mb-4">
          <span>
            Showing {filteredMLAs.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
            {' '}–{' '}
            {Math.min(page * PAGE_SIZE, filteredMLAs.length)} of {filteredMLAs.length} matching constituencies
          </span>
          <span className="text-slate-400">
            Wikipedia photos load from Wikimedia on demand; unavailable profiles keep the verified placeholder.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visibleMLAs.length > 0 ? (
            visibleMLAs.map((mla) => {
              const imageUrl = wikiProfiles[mla.name]?.imageUrl || mla.avatar;

              return (
                <div
                  key={mla.constituencyNumber}
                  className={`border p-5 rounded-2xl flex flex-col h-full transition-shadow ${
                    mla.status === 'Vacant'
                      ? 'bg-slate-50 border-dashed border-slate-300'
                      : 'bg-indigo-50/40 border-indigo-100 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <img
                      src={imageUrl}
                      alt={mla.status === 'Vacant' ? 'Vacant constituency seat' : `${mla.name} profile`}
                      onError={(event) => {
                        event.currentTarget.src = mla.avatar;
                      }}
                      loading="lazy"
                      className="w-16 h-16 rounded-full border-2 border-indigo-200 shadow-sm shrink-0 bg-white object-cover"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-indigo-950 leading-tight mb-1 flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{mla.name}</span>
                        {mla.status === 'Vacant' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                      </h3>
                      <span className="text-[11px] text-indigo-700 font-medium bg-indigo-100 px-1.5 py-0.5 rounded inline-block mb-1">
                        {mla.party} · {mla.status === 'Vacant'
                          ? (language === 'ta' ? 'மூலப் பதிவில் காலியிடம்' : 'Vacant in source snapshot')
                          : (language === 'ta' ? '2026-இல் தேர்ந்தெடுக்கப்பட்டவர்' : 'Elected in 2026')}
                      </span>
                      <p className="text-xs font-semibold text-slate-700 flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-indigo-500 shrink-0" />
                        #{mla.constituencyNumber} {mla.constituency}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-center">
                        <Building2 className="w-3 h-3 mr-1 shrink-0" />
                        {mla.district} District
                      </p>
                    </div>
                  </div>

                  {mla.note && (
                    <p className="text-[11px] text-slate-500 mb-3 leading-snug">{mla.note}</p>
                  )}

                  <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-indigo-100/50">
                    <button
                      type="button"
                      onClick={() => void openProfile(mla)}
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white px-3 py-2 hover:bg-indigo-700"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Profile & constituency news
                    </button>
                    <a
                      href={mla.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1"
                    >
                      View election source <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {language === 'ta' ? 'எந்த தரவும் கிடைக்கவில்லை' : 'No Representatives Found'}
              </h3>
              <p className="text-sm text-slate-500">
                {language === 'ta' ? 'உங்கள் தேடலை மாற்றி மீண்டும் முயற்சிக்கவும்.' : 'Try adjusting your search or district filter.'}
              </p>
            </div>
          )}
        </div>

        {filteredMLAs.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-xs font-semibold text-slate-600">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {selectedMLA && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 p-4 sm:p-8 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mla-profile-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeProfile();
          }}
        >
          <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                MLA profile & constituency news
              </div>
              <button
                type="button"
                onClick={closeProfile}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Close profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
              <aside className="rounded-2xl bg-slate-50 border border-slate-200 p-5 h-fit">
                <img
                  src={selectedProfile?.imageUrl || selectedMLA.avatar}
                  alt={selectedMLA.status === 'Vacant' ? 'Vacant constituency seat' : `${selectedMLA.name} Wikipedia profile`}
                  onError={(event) => {
                    event.currentTarget.src = selectedMLA.avatar;
                  }}
                  className="w-36 h-36 rounded-2xl object-cover border border-slate-200 bg-white mx-auto mb-4"
                />

                <h2 id="mla-profile-title" className="text-lg font-bold text-slate-900 text-center">
                  {selectedMLA.name}
                </h2>
                <p className="text-xs text-slate-500 text-center mt-1">
                  #{selectedMLA.constituencyNumber} {selectedMLA.constituency}
                </p>
                <p className="text-xs text-slate-500 text-center">
                  {selectedMLA.district} · {selectedMLA.party}
                </p>

                {profileLoading && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <LoaderCircle className="w-4 h-4 animate-spin" /> Loading Wikipedia profile…
                  </div>
                )}

                {selectedProfile ? (
                  <div className="mt-5 space-y-2">
                    <a
                      href={selectedProfile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
                    >
                      Wikipedia profile <ExternalLink className="w-3 h-3" />
                    </a>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Profile image and summary are loaded directly from Wikipedia/Wikimedia and are not copied into the repository.
                    </p>
                  </div>
                ) : !profileLoading && selectedMLA.status !== 'Vacant' ? (
                  <p className="mt-4 text-[11px] text-slate-500 leading-relaxed">
                    No matching Wikipedia page was found for this name, so the app keeps the verified placeholder instead of guessing another person.
                  </p>
                ) : null}
              </aside>

              <div className="space-y-5 min-w-0">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-indigo-600 font-bold">Wikipedia context</div>
                  {selectedProfile?.description && (
                    <p className="text-sm font-semibold text-slate-800 mt-1">{selectedProfile.description}</p>
                  )}
                  <p className="text-sm text-slate-600 leading-relaxed mt-2">
                    {selectedProfile?.extract || selectedMLA.note || 'No profile summary is available from Wikipedia for this entry.'}
                  </p>
                </div>

                <LiveNews
                  key={selectedMLA.constituencyNumber}
                  initialQuery={selectedNewsQuery}
                  compact
                  title={`${selectedMLA.constituency} constituency news`}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
