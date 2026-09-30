import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const faqs = [
  { qEn: 'What kind of problems can I report?', aEn: 'Street lights, water and drainage, electricity, roads and potholes, sanitation and waste, and public health issues such as mosquito fogging.', qTa: 'எந்த வகையான பிரச்சினைகளை புகார் செய்யலாம்?', aTa: 'தெருவிளக்கு, குடிநீர் மற்றும் கழிவுநீர், மின்சாரம், சாலை பள்ளங்கள், குப்பை மற்றும் பொது சுகாதாரம் தொடர்பான புகார்கள்.' },
  { qEn: 'Can I speak my complaint in Tamil?', aEn: 'Yes. You can speak or type in Tamil, English or Tanglish. The AI reads it and suggests a category and priority for you to confirm.', qTa: 'தமிழில் பேசி புகார் அளிக்கலாமா?', aTa: 'ஆம். தமிழ், ஆங்கிலம் அல்லது தங்கிலீஷில் பேசலாம் அல்லது தட்டச்சு செய்யலாம். AI வகையைப் பரிந்துரைக்கும்; நீங்கள் உறுதி செய்யலாம்.' },
  { qEn: 'How do I track my complaint?', aEn: 'After submitting you get a tracking ID (like GRV-2026-00124). Enter it in the Track box on the home page to see every status update.', qTa: 'என் புகாரை எப்படி கண்காணிப்பது?', aTa: 'சமர்ப்பித்த பின் கிடைக்கும் கண்காணிப்பு எண்ணை முகப்புப் பக்கத்தில் உள்ளிட்டு நிலையைப் பார்க்கலாம்.' },
  { qEn: 'Is my personal data safe?', aEn: 'Complaints are visible only to you and verified administrators. Sign-in uses Firebase Authentication, and access is enforced by database security rules.', qTa: 'என் தனிப்பட்ட தகவல்கள் பாதுகாப்பானதா?', aTa: 'உங்கள் புகார்களை நீங்களும் சரிபார்க்கப்பட்ட நிர்வாகிகளும் மட்டுமே காண முடியும்.' },
];

export const FAQSection: React.FC = () => {
  const { language } = useApp();
  const ta = language === 'ta';
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section aria-labelledby="faq-title" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
      <h2 id="faq-title" className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 mb-5">
        <HelpCircle className="w-6 h-6 text-indigo-600" aria-hidden="true" />
        {ta ? 'அடிக்கடி கேட்கப்படும் கேள்விகள்' : 'Frequently asked questions'}
      </h2>
      <div className="divide-y divide-slate-100">
        {faqs.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              <button type="button" aria-expanded={isOpen} aria-controls={`faq-panel-${i}`} onClick={() => setOpen(isOpen ? null : i)} className="w-full flex items-center justify-between gap-4 py-4 text-left font-semibold text-sm sm:text-base text-slate-900 hover:text-indigo-700 transition-colors">
                <span>{ta ? f.qTa : f.qEn}</span>
                <ChevronDown className={`w-5 h-5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {isOpen && <p id={`faq-panel-${i}`} className="pb-4 text-sm text-slate-600 leading-relaxed">{ta ? f.aTa : f.aEn}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
};
