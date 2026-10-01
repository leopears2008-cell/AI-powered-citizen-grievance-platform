import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getAllTNMinisters, getMinisterParties, getMinisterSourceInfo, type TNMinisterProfile } from '../data/tnMinisters';
import { ExternalLink, Search, ShieldAlert, UserRound, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 12;

export const TNMinistersDirectory: React.FC = () => {
  const { language } = useApp();
  const ministers = useMemo(() => getAllTNMinisters(), []);
  const parties = useMemo(() => getMinisterParties(), []);
  const source = useMemo(() => getMinisterSourceInfo(), []);
  const [party, setParty] = useState('All Parties');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<TNMinisterProfile | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ministers.filter((m) => {
      const partyMatch = party === 'All Parties' || m.party === party;
      const textMatch = !q || [m.name, m.designation, m.constituency ?? '', m.party, m.portfolio]
        .join(' ').toLowerCase().includes(q);
      return partyMatch && textMatch;
    });
  }, [ministers, party, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const updateFilter = (fn: () => void) => { fn(); setPage(1); };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-indigo-600">TN Ministers</div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              {language === 'ta' ? 'தமிழ்நாடு அமைச்சர்கள் அடைவு — 2026' : 'Tamil Nadu Ministers Directory — 2026'}
            </h2>
          </div>
          <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
            Source <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <p className="text-sm text-slate-600 mb-2">
          {language === 'ta'
            ? '2026 அமைச்சரவை நியமன பதிவுகளைத் தேடவும். சமீபத்திய அரசாணைகளுடன் பதவித் தகவலைச் சரிபார்க்கவும்.'
            : 'Search the supplied 2026 ministerial appointment roster. Portfolio information should be checked against the newest official government order before relying on it.'}
        </p>
        <p className="text-[11px] text-slate-400 mb-7">
          {source.rosterSize} roster entries · {source.sourceName}. Unknown biography fields are intentionally not fabricated.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
          <div className="sm:col-span-2 relative">
            <label htmlFor="minister-search" className="text-xs font-semibold text-slate-600 block mb-1.5">Search ministers</label>
            <Search className="absolute left-3.5 top-9 w-4 h-4 text-slate-400" />
            <input id="minister-search" value={query} onChange={(e) => updateFilter(() => setQuery(e.target.value))} placeholder="Name, constituency, party, designation, portfolio..." className="w-full pl-11 p-3 text-sm text-slate-900 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-600 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="minister-party" className="text-xs font-semibold text-slate-600 block mb-1.5">Party</label>
            <select id="minister-party" value={party} onChange={(e) => updateFilter(() => setParty(e.target.value))} className="w-full p-3 text-sm border border-slate-300 rounded-xl bg-slate-50">
              {parties.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-between gap-3 text-xs text-slate-500 mb-4">
          <span>Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <span className="hidden sm:inline">{source.verificationNote}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {visible.map((minister) => (
            <article key={minister.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:shadow-md transition-shadow">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <UserRound className="w-7 h-7" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 leading-tight">{minister.name}</h3>
                  <p className="text-xs font-semibold text-indigo-700 mt-1">{minister.designation}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{minister.party}{minister.constituency ? ` · ${minister.constituency}` : ''}</p>
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed mt-4 line-clamp-4">{minister.portfolio}</p>
              <button type="button" onClick={() => setSelected(minister)} className="mt-4 w-full inline-flex justify-center items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700">
                View profile
              </button>
            </article>
          ))}
        </div>

        {visible.length === 0 && <div className="py-12 text-center text-sm text-slate-500">No ministers match the current filters.</div>}

        {filtered.length > 0 && (
          <div className="mt-7 flex items-center justify-center gap-3">
            <button type="button" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-semibold disabled:opacity-40"><ChevronLeft className="w-4 h-4" /> Previous</button>
            <span className="text-xs font-semibold text-slate-600">Page {safePage} of {totalPages}</span>
            <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-semibold disabled:opacity-40">Next <ChevronRight className="w-4 h-4" /></button>
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 p-4 sm:p-8 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="minister-profile-title" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 id="minister-profile-title" className="font-bold text-slate-900">{selected.name}</h2>
              <button type="button" onClick={() => setSelected(null)} className="px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100" aria-label="Close profile">Close</button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['Designation', selected.designation],
                  ['Constituency', selected.constituency ?? 'Not verified in source set'],
                  ['Party', selected.party],
                  ['Portfolio', selected.portfolio],
                  ['Appointment date', selected.appointmentDate ?? 'Not verified in source set'],
                  ['Previous offices', selected.previousOffices ?? 'Not verified in source set'],
                  ['Education', selected.education ?? 'Not verified in source set'],
                  ['Profession', selected.profession ?? 'Not verified in source set'],
                  ['Birthplace', selected.birthplace ?? 'Not verified in source set'],
                  ['Date of birth', selected.dateOfBirth ?? 'Not verified in source set'],
                  ['Election history', selected.electionHistory ?? 'Not verified in source set'],
                  ['Affidavit source', selected.affidavitSource ?? 'Not verified in source set'],
                  ['Photo source', selected.photoSource ?? 'Not verified in source set'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-200 p-3">
                    <div className="text-[10px] uppercase tracking-wide font-bold text-slate-400">{label}</div>
                    <div className="text-sm text-slate-800 mt-1">{value}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-900 leading-relaxed">{selected.verificationNote}</p>
              </div>
              <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-900">
                Open source <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
