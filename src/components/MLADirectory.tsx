import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getAvailableDistricts, getConstituenciesForDistrict, getAllMLAs, getDataSourceInfo } from '../data/mlaProfiles';
import { Search, MapPin, Building2, User, AlertTriangle, ExternalLink } from 'lucide-react';

export const MLADirectory: React.FC = () => {
  const { language } = useApp();
  const districts = useMemo(() => getAvailableDistricts(), []);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [searchQuery, setSearchQuery] = useState('');

  const allMLAs = useMemo(() => getAllMLAs(), []);
  const dataSource = useMemo(() => getDataSourceInfo(), []);

  const displayedMLAs = useMemo(() => {
    let filtered = selectedDistrict === 'All Districts'
      ? allMLAs
      : allMLAs.filter((m) => m.district === selectedDistrict);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.constituency.toLowerCase().includes(q) ||
          m.party.toLowerCase().includes(q) ||
          m.district.toLowerCase().includes(q)
      );
    }

    return filtered.sort((a, b) => a.constituencyNumber - b.constituencyNumber);
  }, [selectedDistrict, searchQuery, allMLAs]);

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
          <a className="underline focus-visible:outline focus-visible:outline-2" href="https://results.eci.gov.in/ResultAcGenMay2026/" target="_blank" rel="noopener noreferrer">Election Commission of India 2026 results</a>{' '}
          and current Assembly records before relying on any entry.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              <span id="district-filter-label">{language === 'ta' ? 'மாவட்டம்' : 'Filter by District'}</span>
            </label>
            <select
              value={selectedDistrict}
              aria-labelledby="district-filter-label"
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
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">
              {language === 'ta' ? 'தேடல்' : 'Search MLA, constituency, district...'}
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ta' ? 'தொகுதி அல்லது உறுப்பினர் பெயர்...' : 'Search by MLA name, constituency, district, or party...'}
                className="w-full pl-11 p-3 text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-slate-50"
              />
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 mb-4">
          Showing {displayedMLAs.length} of {allMLAs.length} constituencies
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedMLAs.length > 0 ? (
            displayedMLAs.map((mla) => (
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
                    src={mla.avatar}
                    alt=""
                    className="w-16 h-16 rounded-full border-2 border-indigo-200 shadow-sm shrink-0 bg-white"
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

                <div className="flex flex-col gap-1.5 mt-auto pt-3 border-t border-indigo-100/50">
                  <p className="text-[10px] text-slate-400 leading-snug">
                    Individual constituency-office contact numbers are not published in a verified,
                    uniform official directory and are intentionally not shown here.
                  </p>
                  <a
                    href={mla.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1"
                  >
                    View source <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="button"
                    className="text-[11px] text-slate-400 hover:text-slate-600 text-left underline underline-offset-2"
                  >
                    Report incorrect information
                  </button>
                </div>
              </div>
            ))
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
      </div>
    </div>
  );
};
