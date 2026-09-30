import React from 'react';
import { Mic, Sparkles, ArrowRight, Tag, Building2, Gauge } from 'lucide-react';
import { useApp } from '../context/AppContext';

/** Static illustration of the AI flow. Sample text only; no real complaint data. */
export const AIDemoCard: React.FC = () => {
  const { language } = useApp();
  const ta = language === 'ta';

  return (
    <section aria-labelledby="ai-demo-title" className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 mb-2">
        <Sparkles className="w-4 h-4" aria-hidden="true" />
        <span>{ta ? 'AI எப்படி உதவுகிறது' : 'See the AI in action'}</span>
        <span className="ml-auto text-[10px] font-normal text-slate-400">{ta ? 'மாதிரி எடுத்துக்காட்டு' : 'Sample example'}</span>
      </div>
      <h2 id="ai-demo-title" className="text-xl sm:text-2xl font-black text-slate-900 mb-5">
        {ta ? 'ஒரு வாக்கியம். AI மீதியை புரிந்துகொள்ளும்.' : 'One sentence. The AI does the sorting.'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
        <div className="rounded-xl bg-white border border-slate-200 p-4">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            <Mic className="w-3.5 h-3.5" aria-hidden="true" /> {ta ? 'குடிமகன் கூறுவது' : 'Citizen says (Tanglish)'}
          </p>
          <p className="text-sm text-slate-800 leading-relaxed italic">
            “Anna, engal street la 3 naala light eriyala, romba iruttu.”
          </p>
        </div>

        <div className="hidden md:flex items-center justify-center text-indigo-400">
          <ArrowRight className="w-6 h-6" aria-hidden="true" />
        </div>

        <div className="rounded-xl bg-white border border-indigo-200 p-4 space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">{ta ? 'AI பரிந்துரை' : 'AI suggestion'}</p>
          <div className="flex items-center gap-2 text-sm"><Tag className="w-4 h-4 text-amber-600" aria-hidden="true" /><span className="text-slate-500">{ta ? 'வகை' : 'Category'}:</span><span className="font-semibold text-slate-900">{ta ? 'தெருவிளக்குகள்' : 'Street Lighting'}</span></div>
          <div className="flex items-center gap-2 text-sm"><Building2 className="w-4 h-4 text-indigo-600" aria-hidden="true" /><span className="text-slate-500">{ta ? 'துறை' : 'Department'}:</span><span className="font-semibold text-slate-900">{ta ? 'மின்சாரம் / விளக்கு' : 'Street Light Maintenance'}</span></div>
          <div className="flex items-center gap-2 text-sm"><Gauge className="w-4 h-4 text-rose-600" aria-hidden="true" /><span className="text-slate-500">{ta ? 'முன்னுரிமை' : 'Priority'}:</span><span className="font-semibold text-slate-900">{ta ? 'நடுத்தரம்' : 'Medium'}</span></div>
        </div>
      </div>
      <p className="mt-4 text-[11px] text-slate-400">
        {ta ? 'AI பரிந்துரைகளை நீங்கள் சமர்ப்பிக்கும் முன் மாற்றலாம்.' : 'You can review and change every AI suggestion before submitting.'}
      </p>
    </section>
  );
};
