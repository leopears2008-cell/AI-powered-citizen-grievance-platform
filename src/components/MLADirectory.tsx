import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { DIRECTORY_AS_OF, DISTRICT_NAMES, getAllMLAs, plainConstituency, type MLAProfile } from '../data/mlaProfiles';
import { DEPARTMENT_SLA, DISTRICT_SLA, SLA_META, getDistrictSla } from '../data/slaMatrix';
import { Search, MapPin, User, Clock, ExternalLink, FileText, X, Info, ShieldCheck, ChevronDown, Star, LayoutGrid, Table2, ArrowRight } from 'lucide-react';

const ALL = 'All Districts';
const PAGE_SIZE = 24;
type View = 'grid' | 'matrix';
type PartyFilter = 'All' | 'Vacant' | string;
type SortKey = 'name' | 'compliance' | 'seats';

const PARTY_STYLE: Record<string, string> = {
  TVK: 'bg-amber-100 text-amber-900 border-amber-200',
  DMK: 'bg-red-100 text-red-800 border-red-200',
  AIADMK: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  INC: 'bg-sky-100 text-sky-800 border-sky-200',
  PMK: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  BJP: 'bg-orange-100 text-orange-800 border-orange-200',
  VCK: 'bg-blue-100 text-blue-800 border-blue-200',
  IUML: 'bg-green-100 text-green-800 border-green-200',
};
const partyStyle = (party: string) => PARTY_STYLE[party] ?? 'bg-slate-100 text-slate-700 border-slate-200';

/** Headline badge for notable offices; the full portfolio is shown as text. */
const officeBadge = (role?: string): { en: string; ta: string; cls: string } | null => {
  if (!role) return null;
  if (/Chief Minister/.test(role)) return { en: 'Chief Minister', ta: 'முதலமைச்சர்', cls: 'bg-navy text-white border-navy' };
  if (/^Leader of the Opposition/.test(role)) return { en: 'Leader of Opposition', ta: 'எதிர்க்கட்சித் தலைவர்', cls: 'bg-red-700 text-white border-red-700' };
  if (/Cabinet Minister/.test(role)) return { en: 'Cabinet Minister', ta: 'அமைச்சர்', cls: 'bg-amber-50 text-amber-900 border-amber-300' };
  return null;
};

const norm = (s: string) => s.toLowerCase();

export const MLADirectory: React.FC = () => {
  const { language, startGrievanceFor, showToast } = useApp();
  const tr = (en: string, ta: string) => (language === 'ta' ? ta : en);

  const allMLAs = useMemo(() => getAllMLAs(), []);
  const [view, setView] = useState<View>('grid');
  const [query, setQuery] = useState('');
  const [district, setDistrict] = useState(ALL);
  const [party, setParty] = useState<PartyFilter>('All');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const panelRef = useRef<HTMLDivElement>(null);

  const partyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    allMLAs.forEach((m) => m.status === 'Elected' && m.party && counts.set(m.party, (counts.get(m.party) ?? 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [allMLAs]);

  const stats = useMemo(() => {
    const vacant = allMLAs.filter((m) => m.status === 'Vacant').length;
    return { seats: allMLAs.length, vacant, elected: allMLAs.length - vacant, districts: DISTRICT_NAMES.length };
  }, [allMLAs]);

  const searchable = useMemo(
    () =>
      allMLAs.map((m) => ({
        m,
        text: norm([m.name, m.constituency, ...m.aliases, m.district, m.party, m.role ?? '', m.note ?? '', `ac ${m.no}`].join(' ')),
      })),
    [allMLAs]
  );

  const tokens = useMemo(() => norm(query).split(/\s+/).filter(Boolean), [query]);

  const results = useMemo(
    () =>
      searchable
        .filter(({ m, text }) => {
          if (district !== ALL && m.district !== district) return false;
          if (party === 'Vacant' && m.status !== 'Vacant') return false;
          if (party !== 'All' && party !== 'Vacant' && (m.status !== 'Elected' || m.party !== party)) return false;
          return tokens.every((tok) => text.includes(tok));
        })
        .map(({ m }) => m),
    [searchable, tokens, district, party]
  );

  const matrixRows = useMemo(() => {
    const rows = DISTRICT_SLA.filter(
      (d) =>
        (district === ALL || d.district === district) &&
        tokens.every((tok) => norm(`${d.district} ${d.hq} ${d.escalation} ${d.portal}`).includes(tok))
    );
    if (sortKey === 'compliance') rows.sort((a, b) => b.compliance - a.compliance);
    else if (sortKey === 'seats') rows.sort((a, b) => b.acCount - a.acCount || a.district.localeCompare(b.district));
    else rows.sort((a, b) => a.district.localeCompare(b.district));
    return rows;
  }, [district, tokens, sortKey]);

  useEffect(() => setVisible(PAGE_SIZE), [query, district, party, view]);

  const districtSla = district === ALL ? undefined : getDistrictSla(district);
  const filtersActive = query.trim() !== '' || district !== ALL || party !== 'All';

  const clearFilters = () => {
    setQuery('');
    setDistrict(ALL);
    setParty('All');
  };

  const viewDistrictSla = (name: string) => {
    setView('grid');
    setDistrict(name);
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const fileGrievance = (m: MLAProfile) => {
    startGrievanceFor(m.district, m.constituency);
    showToast(
      tr(`${plainConstituency(m.constituency)}, ${m.district} pre-selected for your complaint.`, `${plainConstituency(m.constituency)}, ${m.district} உங்கள் புகாருக்காக தேர்தெடுக்கப்பட்டது.`),
      'info'
    );
  };

  const inputClass = 'w-full p-3 text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-navy focus:outline-none bg-white';
  const pill = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-navy ${
      active ? 'bg-navy text-white border-navy' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
    }`;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Intro + filters */}
      <section className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6" aria-labelledby="dir-title">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="dir-title" className="text-2xl font-extrabold text-navy">{tr('MLA & District SLA Directory', 'MLA & மாவட்ட SLA கையேடு')}</h2>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              {tr(
                'Find your constituency and MLA, check how fast your district is expected to resolve grievances, then file a complaint with your location already selected.',
                'உங்கள் தொகுதி மற்றும் MLA-வைக் கண்டறிந்து, உங்கள் மாவட்டத்தின் தீர்வு கால அளவைப் பார்த்து, இடம் தேர்தெடுக்கப்பட்ட நிலையில் புகார் அளிக்கவும்.'
              )}
            </p>
          </div>
          <dl className="grid grid-cols-4 gap-2 text-center shrink-0">
            {[
              [stats.districts, tr('Districts', 'மாவட்டங்கள்')],
              [stats.seats, tr('Constituencies', 'தொகுதிகள்')],
              [stats.elected, tr('MLAs seated', 'MLA-க்கள்')],
              [stats.vacant, tr('Vacant', 'காலி')],
            ].map(([n, label]) => (
              <div key={String(label)} className="rounded-xl bg-sky-tint px-3 py-2">
                <dd className="text-xl font-extrabold text-navy leading-none">{n}</dd>
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mt-1">{label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="inline-flex rounded-full border border-slate-300 bg-slate-50 p-1" role="group" aria-label={tr('Directory view', 'காட்சி')}>
          {([
            ['grid', LayoutGrid, tr(`MLA Directory Grid (${stats.seats})`, `MLA கையேடு (${stats.seats})`)],
            ['matrix', Table2, tr(`District SLA Matrix (${stats.districts})`, `மாவட்ட SLA அட்டவைணை (${stats.districts})`)],
          ] as const).map(([key, Icon, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => setView(key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-navy ${
                view === key ? 'bg-navy text-white shadow-sm' : 'text-slate-600 hover:text-navy'
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-7">
            <label htmlFor="dir-search" className="text-xs font-semibold text-slate-600 block mb-1.5">
              {view === 'grid'
                ? tr('Search MLA, constituency (AC), district, party or portfolio', 'MLA, தொகுதி, மாவட்டம், கட்சி அல்லது துறை தேடல்')
                : tr('Search district, HQ or escalation authority', 'மாவட்டம், தலைமையகம் அல்லது மேல்முறையீட்டு அதிகாரி தேடல்')}
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                id="dir-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tr('e.g. Edappadi, Udhayanidhi, Health, AC 86…', 'எ.கா. எடப்பாடி, உதயநிதி, AC 86…')}
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>
          <div className="md:col-span-5">
            <label htmlFor="dir-district" className="text-xs font-semibold text-slate-600 block mb-1.5">{tr('District', 'மாவட்டம்')}</label>
            <select id="dir-district" value={district} onChange={(e) => setDistrict(e.target.value)} className={inputClass}>
              <option value={ALL}>{tr('All 38 Districts', 'அனைத்து 38 மாவட்டங்கள்')}</option>
              {DISTRICT_NAMES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {view === 'grid' && (
          <div role="group" aria-label={tr('Filter by party', 'கட்சி வாரியாக')} className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={party === 'All'} onClick={() => setParty('All')} className={pill(party === 'All')}>
              {tr('All', 'அனைத்தும்')} ({stats.seats})
            </button>
            {partyCounts.map(([p, n]) => (
              <button key={p} type="button" aria-pressed={party === p} onClick={() => setParty(p)} className={pill(party === p)}>
                {p} ({n})
              </button>
            ))}
            <button type="button" aria-pressed={party === 'Vacant'} onClick={() => setParty('Vacant')} className={pill(party === 'Vacant')}>
              {tr('Vacant', 'காலி')} ({stats.vacant})
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900" role="note">
          <p className="flex gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {tr(
                `${DIRECTORY_AS_OF}. This is a snapshot, not a live roster; ${stats.vacant} seats remain vacant. Contact details are not published until verified from an official source.`,
                `${DIRECTORY_AS_OF}. இது நிலைப்படம் மட்டுமே; ${stats.vacant} தொகுதிகள் காலியாக உள்ளன. சரிபார்க்கப்பட்ட தொடர்பு விவரங்கள் வெளியிடப்படவில்லை.`
              )}
            </span>
          </p>
          <p className="flex gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {tr(
                `SLA timelines and compliance figures come from the ${SLA_META.source}. Confirm with the district's official portal.`,
                'SLA கால அளவுகள் மற்றும் இணக்க விகிதங்கள் திட்ட SLA அட்டவைணையிலிருந்து எடுக்கப்பட்டவை. மாவட்ட அதிகாரப்பூர்வ இணையதளத்தில் உறுதிசெய்யவும்.'
              )}
            </span>
          </p>
        </div>
      </section>

      {view === 'matrix' ? (
        /* ---------- District SLA matrix ---------- */
        <section className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-4" aria-label={tr('District SLA matrix', 'மாவட்ட SLA அட்டவைணை')}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700" role="status" aria-live="polite">
              {tr(`${matrixRows.length} of ${stats.districts} districts`, `${stats.districts} மாவட்டங்களில் ${matrixRows.length}`)}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="dir-sort" className="text-xs font-semibold text-slate-600">{tr('Sort', 'வரிசை')}</label>
              <select id="dir-sort" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="rounded-lg border border-slate-300 bg-white p-2 text-xs">
                <option value="name">A–Z</option>
                <option value="compliance">{tr('Highest compliance', 'அதிக இணக்கம்')}</option>
                <option value="seats">{tr('Most constituencies', 'அதிக தொகுதிகள்')}</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[860px] text-left text-xs">
              <caption className="sr-only">{tr('District SLA and escalation matrix', 'மாவட்ட SLA மற்றும் மேல்முறையீட்டு அட்டவைணை')}</caption>
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide">
                <tr>
                  <th scope="col" className="p-3">{tr('District', 'மாவட்டம்')}</th>
                  <th scope="col" className="p-3">{tr('HQ', 'தலைமையகம்')}</th>
                  <th scope="col" className="p-3 text-center">ACs</th>
                  <th scope="col" className="p-3">{tr('Emergency', 'அவசரம்')}</th>
                  <th scope="col" className="p-3">{tr('Standard', 'வழக்கமான')}</th>
                  <th scope="col" className="p-3">{tr('Revenue', 'வருவாய்')}</th>
                  <th scope="col" className="p-3">{tr('Compliance', 'இணக்கம்')}</th>
                  <th scope="col" className="p-3">{tr('Escalation authority', 'மேல்முறையீட்டு அதிகாரி')}</th>
                  <th scope="col" className="p-3"><span className="sr-only">{tr('Actions', 'செயல்கள்')}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {matrixRows.map((d) => (
                  <tr key={d.district} className="hover:bg-sky-tint/50">
                    <th scope="row" className="p-3 font-bold text-navy">
                      <a href={`https://${d.portal}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {d.district}
                        <span className="sr-only"> ({d.portal}, {tr('opens in a new tab', 'புதிய தாவலில் திறக்கும்')})</span>
                      </a>
                    </th>
                    <td className="p-3">{d.hq}</td>
                    <td className="p-3 text-center">{d.acCount}</td>
                    <td className="p-3 whitespace-nowrap">{d.emergency}</td>
                    <td className="p-3 whitespace-nowrap">{d.standard}</td>
                    <td className="p-3 whitespace-nowrap">{d.revenue}</td>
                    <td className="p-3 whitespace-nowrap font-bold text-emerald-700">{d.compliance.toFixed(1)}%</td>
                    <td className="p-3">{d.escalation}</td>
                    <td className="p-3">
                      <button type="button" onClick={() => viewDistrictSla(d.district)} className="whitespace-nowrap font-bold text-action hover:underline">
                        {tr('View MLAs', 'MLA-க்கள்')} →
                      </button>
                    </td>
                  </tr>
                ))}
                {matrixRows.length === 0 && (
                  <tr><td colSpan={9} className="p-8 text-center text-slate-500">{tr('No districts match your search.', 'தேடலுக்கு மாவட்டம் இல்லை.')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <>
          {/* ---------- District SLA panel ---------- */}
          <div ref={panelRef} className="scroll-mt-28">
            {districtSla && (
              <section className="bg-white rounded-2xl shadow-card border border-slate-200 p-6 sm:p-8 space-y-6" aria-label={tr('District SLA timelines', 'மாவட்ட SLA கால அளவுகள்')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-ai">{tr('District SLA', 'மாவட்ட SLA')}</p>
                    <h3 className="text-2xl font-extrabold text-navy">{districtSla.district}</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {tr('HQ', 'தலைமையகம்')}: {districtSla.hq} · {districtSla.acCount} {tr('constituencies', 'தொகுதிகள்')} ·{' '}
                      <a href={`https://${districtSla.portal}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-action hover:underline">
                        {districtSla.portal}
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        <span className="sr-only">{tr('(opens in a new tab)', '(புதிய தாவலில் திறக்கும்)')}</span>
                      </a>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{tr('Escalate to', 'மேல்முறையீடு')}: <b>{districtSla.escalation}</b></p>
                  </div>
                  <button type="button" onClick={() => setDistrict(ALL)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                    {tr('All districts', 'அனைத்து மாவட்டங்கள்')}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    [tr('Emergency', 'அவசரம்'), districtSla.emergency, 'bg-red-50 text-red-800 border-red-200'],
                    [tr('Standard', 'வழக்கமான'), districtSla.standard, 'bg-sky-tint text-navy border-slate-200'],
                    [tr('Revenue', 'வருவாய்'), districtSla.revenue, 'bg-amber-50 text-amber-900 border-amber-200'],
                  ].map(([label, value, cls]) => (
                    <div key={label} className={`rounded-2xl border p-4 ${cls}`}>
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        {label} {tr('resolution target', 'தீர்வு இலக்கு')}
                      </p>
                      <p className="mt-1 text-3xl font-black">{value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span>{tr('Reported SLA compliance', 'தெரிவிக்கப்பட்ட SLA இணக்கம்')}</span>
                    <span className="text-navy font-bold">{districtSla.compliance.toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={districtSla.compliance} aria-label={tr('SLA compliance', 'SLA இணக்கம்')}>
                    <div className="h-full rounded-full bg-ai" style={{ width: `${districtSla.compliance}%` }} />
                  </div>
                </div>

                <details className="group rounded-2xl border border-slate-200">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-4 text-sm font-bold text-navy">
                    {tr('Department SLA standards and escalation officers', 'துறை வாரியான SLA மற்றும் மேல்முறையீட்டு அதிகாரிகள்')}
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="overflow-x-auto border-t border-slate-200">
                    <table className="w-full min-w-[640px] text-left text-xs">
                      <caption className="sr-only">{tr('Department SLA standards', 'துறை SLA தரநிலைகள்')}</caption>
                      <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide">
                        <tr>
                          <th scope="col" className="p-3">{tr('Department', 'துறை')}</th>
                          <th scope="col" className="p-3">{tr('Emergency', 'அவசரம்')}</th>
                          <th scope="col" className="p-3">{tr('Standard', 'வழக்கமான')}</th>
                          <th scope="col" className="p-3">{tr('Complex', 'சிக்கலான')}</th>
                          <th scope="col" className="p-3">L1 {tr('officer', 'அதிகாரி')}</th>
                          <th scope="col" className="p-3">L2 {tr('officer', 'அதிகாரி')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {DEPARTMENT_SLA.map((d) => (
                          <tr key={d.code}>
                            <th scope="row" className="p-3 font-semibold text-navy">{d.department}</th>
                            <td className="p-3 whitespace-nowrap">{d.emergency}</td>
                            <td className="p-3 whitespace-nowrap">{d.standard}</td>
                            <td className="p-3 whitespace-nowrap">{d.complex}</td>
                            <td className="p-3">{d.l1Officer}</td>
                            <td className="p-3">{d.l2Officer}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </section>
            )}
          </div>

          {/* ---------- MLA grid ---------- */}
          <section aria-label={tr('MLA results', 'MLA முடிவுகள்')} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-700" role="status" aria-live="polite">
                {tr(`${results.length} of ${stats.seats} constituencies`, `${stats.seats} தொகுதிகளில் ${results.length}`)}
              </p>
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="text-xs font-bold text-action hover:underline">{tr('Clear filters', 'வடிக்கட்டிகளை நீக்கு')}</button>
              )}
            </div>

            {results.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {results.slice(0, visible).map((m) => {
                    const vacant = m.status === 'Vacant';
                    const sla = getDistrictSla(m.district);
                    const badge = officeBadge(m.role);
                    return (
                      <article key={m.no} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-md bg-navy px-2 py-1 text-[11px] font-bold text-white">AC #{m.no}</span>
                          {vacant ? (
                            <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase text-amber-800">{tr('Vacant', 'காலி')}</span>
                          ) : (
                            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${partyStyle(m.party)}`}>{m.party}</span>
                          )}
                        </div>

                        {badge && (
                          <span className={`mt-3 inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.cls}`}>
                            <Star className="w-3 h-3" aria-hidden="true" />
                            {tr(badge.en, badge.ta)}
                          </span>
                        )}

                        <div className="mt-3 flex items-start gap-3">
                          <div aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className={`text-base font-extrabold leading-snug ${vacant ? 'text-slate-500 italic' : 'text-navy'}`}>
                              {vacant ? tr('Seat vacant', 'தொகுதி காலி') : m.name}
                            </h3>
                            <p className="text-sm font-semibold text-slate-700">
                              {plainConstituency(m.constituency)}
                              {m.reserved && <span className="ml-1.5 align-middle rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">{m.reserved}</span>}
                            </p>
                            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                              <MapPin className="w-3.5 h-3.5 text-ai shrink-0" aria-hidden="true" />
                              <button type="button" onClick={() => viewDistrictSla(m.district)} className="rounded-full bg-sky-tint px-2 py-0.5 font-semibold text-navy hover:underline" title={tr('View district SLA', 'மாவட்ட SLA காண')}>
                                {m.district}
                              </button>
                              {vacant && m.party && <span className="text-slate-500">{tr(`Last held: ${m.party}`, `கடைசியாக: ${m.party}`)}</span>}
                            </p>
                          </div>
                        </div>

                        {m.role && <p className="mt-3 text-xs leading-relaxed text-slate-600">{m.role}</p>}
                        {m.note && <p className="mt-2 text-xs leading-relaxed text-slate-500">{m.note}</p>}

                        {sla && (
                          <p className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                            <span>{tr('District SLA compliance', 'மாவட்ட SLA இணக்கம்')}</span>
                            <span className="font-bold text-emerald-700">{sla.compliance.toFixed(1)}% · {sla.emergency} {tr('emergency', 'அவசரம்')}</span>
                          </p>
                        )}

                        <div className="mt-auto pt-4">
                          <button
                            type="button"
                            onClick={() => fileGrievance(m)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-navy-dark focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2"
                          >
                            <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>{tr(`File Grievance in ${plainConstituency(m.constituency)}`, `${plainConstituency(m.constituency)} தொகுதியில் புகார் அளிக்க`)}</span>
                            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
                {visible < results.length && (
                  <div className="text-center">
                    <button type="button" onClick={() => setVisible((v) => v + PAGE_SIZE)} className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-navy hover:bg-slate-50">
                      {tr(`Show more (${results.length - visible} remaining)`, `மேலும் காட்டு (${results.length - visible} மீதம்)`)}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white py-12 text-center">
                <User className="w-12 h-12 text-slate-300 mx-auto mb-3" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-slate-900 mb-1">{tr('No constituencies found', 'தொகுதிகள் எதுவும் கிடைக்கவில்லை')}</h3>
                <p className="text-sm text-slate-500 mb-4">{tr('Try a different spelling or clear the filters.', 'வேறு எழுத்துப்பிழையுடன் முயற்சிக்கவும் அல்லது வடிக்கட்டிகளை நீக்கவும்.')}</p>
                <button type="button" onClick={clearFilters} className="text-sm font-bold text-action hover:underline">{tr('Clear filters', 'வடிக்கட்டிகளை நீக்கு')}</button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};
