import React from 'react';
import { MapPin, Flame, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export const InteractiveMap: React.FC = () => {
  const { language } = useApp();
  const [data,setData]=React.useState<Awaited<ReturnType<typeof api.getPublicTransparency>>|null>(null);
  const [loading,setLoading]=React.useState(true);
  const load=React.useCallback(()=>{setLoading(true);api.getPublicTransparency().then(setData).catch(()=>setData(null)).finally(()=>setLoading(false));},[]);
  React.useEffect(()=>{load();const id=window.setInterval(load,60000);return()=>window.clearInterval(id)},[load]);
  return <section aria-labelledby="heatmap-title" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
    <div className="flex items-start justify-between gap-3">
      <div><h2 id="heatmap-title" className="text-base font-bold text-slate-900 flex items-center gap-2"><Flame className="w-5 h-5 text-orange-600"/>{language==='ta'?'நேரடி புகார் வெப்ப வரைபடம்':'Live Grievance Heatmap'}</h2>
      <p className="mt-1 text-xs text-slate-600">{language==='ta'?'மொத்த பகுதித் தரவு மட்டும்; தனிப்பட்ட முகவரிகள் காட்டப்படாது.':'Aggregated area activity only. Individual citizen addresses are never exposed.'}</p></div>
      <button type="button" onClick={load} disabled={loading} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50" aria-label="Refresh heatmap"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/></button>
    </div>
    {!data ? <p className="text-sm text-slate-500">Heatmap data is temporarily unavailable.</p> : <div className="grid lg:grid-cols-12 gap-5">
      <div className="lg:col-span-8 min-h-[330px] rounded-2xl bg-slate-950 relative overflow-hidden border border-slate-800">
        <div aria-hidden="true" className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:18px_18px]"/>
        {data.districts.slice(0,12).map((d,i)=>{
          const x=12+((i*37)%76), y=16+((i*61)%68), size=Math.min(76,22+d.total*3);
          return <div key={d.district} className="absolute -translate-x-1/2 -translate-y-1/2 group" style={{left:`${x}%`,top:`${y}%`}}>
            <div className="rounded-full bg-orange-500/25 flex items-center justify-center animate-pulse" style={{width:size,height:size}}><div className="w-4 h-4 rounded-full bg-orange-500 ring-4 ring-orange-400/20"/></div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap rounded-lg bg-white/95 px-2 py-1 text-[10px] font-bold text-slate-800 shadow-lg">{d.district}: {d.total}</div>
          </div>
        })}
        <div className="absolute bottom-3 left-3 text-[10px] text-slate-300 flex items-center gap-1"><MapPin className="w-3 h-3"/>Aggregated activity cells</div>
      </div>
      <div className="lg:col-span-4 space-y-3">{data.districts.slice(0,6).map(d=><div key={d.district} className="rounded-xl border border-slate-200 p-3"><div className="flex justify-between text-xs font-bold"><span>{d.district}</span><span>{d.total}</span></div><div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full" style={{width:`${Math.max(5,Math.min(100,d.total/Math.max(1,data.metrics.total)*100*4))}%`}}/></div><p className="mt-1 text-[10px] text-slate-500">{d.active} active · {d.resolved} resolved</p></div>)}</div>
    </div>}
  </section>;
};
