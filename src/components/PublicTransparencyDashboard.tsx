import React from 'react';
import { Activity, CheckCircle2, Clock3, MapPinned, ShieldCheck, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export const PublicTransparencyDashboard: React.FC = () => {
  const { language } = useApp();
  const [data,setData] = React.useState<Awaited<ReturnType<typeof api.getPublicTransparency>>|null>(null);
  React.useEffect(()=>{ api.getPublicTransparency().then(setData).catch(()=>setData(null)); },[]);
  if(!data) return null;
  const m=data.metrics;
  const cards=[
    [Activity,m.total,language==='ta'?'மொத்த புகார்கள்':'Total grievances'],
    [Clock3,m.active,language==='ta'?'செயலில்':'Active'],
    [CheckCircle2,m.resolved,language==='ta'?'தீர்க்கப்பட்டது':'Resolved'],
    [AlertTriangle,m.breached,language==='ta'?'SLA மீறல்கள்':'SLA breached'],
  ] as const;
  const max=Math.max(1,...data.districts.map(d=>d.total));
  return <section aria-labelledby="transparency-title" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div><h2 id="transparency-title" className="text-lg font-bold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-indigo-600"/>{language==='ta'?'பொது வெளிப்படைத்தன்மை':'Public Transparency Dashboard'}</h2>
      <p className="text-xs text-slate-500 mt-1">{language==='ta'?'தனிப்பட்ட தகவல் இல்லாமல் மொத்த சேவைத் தரவு.':'Aggregate service data only — no citizen-identifying information is exposed.'}</p></div>
      <span className="text-[10px] font-semibold text-slate-400">Updated {new Date(data.generatedAt).toLocaleTimeString('en-IN')}</span>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(([Icon,value,label])=><div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><Icon className="w-4 h-4 text-indigo-600"/><p className="text-2xl font-black text-slate-900 mt-2">{value}</p><p className="text-[11px] font-semibold text-slate-500">{label}</p></div>)}
    </div>
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="rounded-2xl border border-slate-200 p-4"><h3 className="text-sm font-bold text-slate-900 flex gap-2 items-center"><MapPinned className="w-4 h-4 text-indigo-600"/> {language==='ta'?'புகார் அடர்த்தி':'Live grievance heatmap'}</h3>
        <div className="mt-4 space-y-3">{data.districts.slice(0,8).map(d=><div key={d.district}><div className="flex justify-between text-[11px] font-semibold mb-1"><span>{d.district}</span><span>{d.total} total · {d.active} active</span></div><div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-indigo-600" style={{width:`${Math.max(6,d.total/max*100)}%`}}/></div></div>)}</div>
        <p className="text-[10px] text-slate-400 mt-3">Heat cells are aggregated and suppressed unless at least two reports share the rounded area.</p>
      </div>
      <div className="rounded-2xl border border-slate-200 p-4"><h3 className="text-sm font-bold text-slate-900">Service categories</h3>
        <div className="mt-4 grid grid-cols-2 gap-2">{data.categories.slice(0,8).map(c=><div key={c.name} className="rounded-xl bg-slate-50 border border-slate-100 p-3"><p className="text-[11px] font-semibold text-slate-600">{c.name}</p><p className="text-lg font-black text-slate-900">{c.value}</p></div>)}</div>
        <div className="mt-4 flex items-center justify-between text-xs"><span className="text-slate-500">Resolution rate</span><strong className="text-emerald-700">{m.resolutionRate}%</strong></div>
      </div>
    </div>
  </section>;
};
