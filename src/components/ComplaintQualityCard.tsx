import React from 'react';
import { BrainCircuit, AlertTriangle, CheckCircle2, Copy } from 'lucide-react';
import { api } from '../services/api';
import type { GrievancePriority } from '../types';

export const ComplaintQualityCard: React.FC<{text:string;category?:string;district?:string;priority?:GrievancePriority}> = ({text,category,district,priority}) => {
 const [result,setResult]=React.useState<Awaited<ReturnType<typeof api.assessComplaintQuality>>|null>(null);
 React.useEffect(()=>{const timer=setTimeout(()=>{if(text.trim().length>=20) api.assessComplaintQuality({text,category,district,priority}).then(setResult).catch(()=>setResult(null));},450);return()=>clearTimeout(timer)},[text,category,district,priority]);
 if(!result) return null;
 return <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-3" aria-live="polite">
  <div className="flex items-center justify-between"><h4 className="text-xs font-black text-indigo-950 flex gap-2"><BrainCircuit className="w-4 h-4"/> AI complaint quality</h4><span className="text-xs font-black text-indigo-700">{result.completenessScore}/100</span></div>
  <div className="h-2 rounded-full bg-white overflow-hidden"><div className="h-full bg-indigo-600 rounded-full" style={{width:`${result.completenessScore}%`}}/></div>
  <div className="grid grid-cols-2 gap-2 text-[11px]"><div className="bg-white rounded-xl p-3"><span className="text-slate-500">Routing</span><p className="font-bold text-slate-900">{result.routing}</p></div><div className="bg-white rounded-xl p-3"><span className="text-slate-500">SLA</span><p className="font-bold text-slate-900">{result.slaDays} day(s)</p></div><div className="bg-white rounded-xl p-3"><span className="text-slate-500 flex gap-1"><Copy className="w-3 h-3"/>Duplicate risk</span><p className="font-bold text-slate-900">{Math.round(result.duplicateProbability*100)}%</p></div><div className="bg-white rounded-xl p-3"><span className="text-slate-500">Severity</span><p className="font-bold text-slate-900">{result.severity}</p></div></div>
  {result.missingFields.length>0 ? <p className="text-[11px] text-amber-800 flex gap-1"><AlertTriangle className="w-3 h-3 shrink-0 mt-0.5"/>{result.missingFields[0]}</p> : <p className="text-[11px] text-emerald-800 flex gap-1"><CheckCircle2 className="w-3 h-3 mt-0.5"/>Complaint contains enough detail for initial routing.</p>}
 </div>;
};
