import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin } from 'lucide-react';

const districts = [
  { id: 'Chennai', tamil: 'சென்னை', x: 72, y: 28 },
  { id: 'Madurai', tamil: 'மதுரை', x: 52, y: 75 },
  { id: 'Coimbatore', tamil: 'கோயம்புத்தூர்', x: 30, y: 56 },
  { id: 'Tiruchirappalli', tamil: 'திருச்சிராப்பள்ளி', x: 55, y: 52 },
  { id: 'Salem', tamil: 'சேலம்', x: 48, y: 40 },
];

export const InteractiveMap: React.FC = () => {
  const { language } = useApp();
  const [activeDistrict, setActiveDistrict] = useState(districts[0].id);
  const current = districts.find((district) => district.id === activeDistrict) ?? districts[0];

  return (
    <section aria-labelledby="district-map-title" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="pb-3 border-b border-slate-100">
        <h2 id="district-map-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-600" aria-hidden="true" />
          {language === 'ta' ? 'மாவட்டத் தேர்வு வரைபடம்' : 'District selector'}
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          {language === 'ta'
            ? 'இது சுட்டிக்காட்டும் வரைபடம் மட்டுமே; புகார் எண்ணிக்கை அல்லது உண்மையான இடத் தரவு இதில் காட்டப்படவில்லை.'
            : 'Illustrative selector only. It does not show complaint counts or precise geographic locations.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div role="group" aria-label={language === 'ta' ? 'மாவட்டத் தேர்வு' : 'Select a district'} className="lg:col-span-7 bg-slate-950 rounded-2xl p-6 relative min-h-[320px] overflow-hidden border border-slate-800">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
          {districts.map((district) => {
            const selected = district.id === activeDistrict;
            return (
              <button
                key={district.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setActiveDistrict(district.id)}
                style={{ top: `${district.y}%`, left: `${district.x}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${selected ? 'bg-indigo-600 text-white ring-2 ring-indigo-300' : 'bg-slate-800 text-slate-100 border border-slate-600 hover:bg-slate-700'}`}
              >
                {language === 'ta' ? district.tamil : district.id}
              </button>
            );
          })}
          <p className="absolute bottom-3 left-3 text-[10px] text-slate-300">
            {language === 'ta' ? 'சுட்டிக்காட்டும் இடமமைப்பு' : 'Illustrative layout'}
          </p>
        </div>
        <div className="lg:col-span-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <p className="text-xs font-semibold text-indigo-900">{language === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட மாவட்டம்' : 'Selected district'}</p>
          <p aria-live="polite" className="mt-2 text-xl font-bold text-indigo-950">
            {language === 'ta' ? current.tamil : current.id}
          </p>
          <p className="mt-3 text-sm text-slate-700">
            {language === 'ta'
              ? 'புகார் படிவத்தில் உங்கள் மாவட்டத்தை நீங்களே தேர்ந்தெடுக்கவும்.'
              : 'Choose your district yourself in the grievance form. This selector does not collect or expose complaint location data.'}
          </p>
        </div>
      </div>
    </section>
  );
};
