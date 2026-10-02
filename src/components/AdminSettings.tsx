import React, { useEffect, useState } from 'react';
import { Save, Settings2, Eye, MessageCircle, LayoutDashboard } from 'lucide-react';
import { api } from '../services/api';
import type { SiteSettings } from '../types';

const DEFAULTS: SiteSettings = {
  id: 'default',
  siteTitle: 'NivaranAI Grievance Portal',
  siteSubtitle: 'AI-assisted civic grievance management',
  announcement: '',
  chatbotEnabled: true,
  showHero: true,
  showAIDemo: true,
  showMap: true,
  showFAQ: true,
  showDirectory: true,
  showMinisters: true,
  showNews: true,
};

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getSiteSettings().then(setSettings).catch(() => setSettings(DEFAULTS)).finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const updated = await api.updateSiteSettings(settings);
      setSettings(updated);
      setMessage('Website settings saved successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save website settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading website settings…</div>;
  }

  const visibility = [
    ['showHero', 'Hero section'],
    ['showAIDemo', 'AI demo section'],
    ['showMap', 'Civic service map'],
    ['showFAQ', 'FAQ section'],
    ['showDirectory', 'MLA directory'],
    ['showMinisters', 'TN Ministers directory'],
    ['showNews', 'Live civic news'],
  ] as const;

  return (
    <section className="rounded-2xl border border-indigo-100 bg-white shadow-sm overflow-hidden" aria-labelledby="admin-settings-title">
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center"><Settings2 className="w-5 h-5" /></div>
        <div>
          <h3 id="admin-settings-title" className="font-black text-slate-900">Website & Civic Service Settings</h3>
          <p className="text-xs text-slate-500">Control what citizens see on the public home page.</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="text-xs font-semibold text-slate-700">
            Website title
            <input value={settings.siteTitle} onChange={(e) => set('siteTitle', e.target.value.slice(0, 120))}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
          </label>
          <label className="text-xs font-semibold text-slate-700">
            Website subtitle
            <input value={settings.siteSubtitle} onChange={(e) => set('siteSubtitle', e.target.value.slice(0, 240))}
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
          </label>
        </div>

        <label className="block text-xs font-semibold text-slate-700">
          Public announcement
          <textarea value={settings.announcement} onChange={(e) => set('announcement', e.target.value.slice(0, 500))}
            rows={3} placeholder="Optional message shown above civic services…"
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
        </label>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
          <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-900"><MessageCircle className="w-4 h-4 text-indigo-600" /> Citizen AI Assistant</div>
          <label className="flex items-center justify-between gap-4 rounded-xl bg-white p-3 border border-slate-200 cursor-pointer">
            <span className="text-sm text-slate-700">Show the citizen AI assistant on the home page</span>
            <input type="checkbox" checked={settings.chatbotEnabled} onChange={(e) => set('chatbotEnabled', e.target.checked)} className="h-4 w-4" />
          </label>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-900"><Eye className="w-4 h-4 text-indigo-600" /> Home page visibility</div>
          <div className="grid sm:grid-cols-2 gap-2">
            {visibility.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm text-slate-700 cursor-pointer">
                {label}
                <input type="checkbox" checked={Boolean(settings[key])} onChange={(e) => set(key, e.target.checked)} className="h-4 w-4" />
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
          <div className="text-xs text-slate-500 flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Changes affect the public home page after save.</div>
          <button type="button" onClick={() => void save()} disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
        {message && <p role="status" className="text-xs font-medium text-slate-600">{message}</p>}
      </div>
    </section>
  );
};
