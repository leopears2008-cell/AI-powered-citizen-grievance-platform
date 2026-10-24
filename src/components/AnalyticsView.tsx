import React, { useEffect, useState } from 'react';
import { BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

type Analytics = {
  metrics: {
    total: number;
    resolved: number;
    pending: number;
    critical: number;
    high: number;
    inProgress: number;
    resolutionRate: number | null;
    avgResolutionHours: number | null;
    citizenSatisfactionScore: number | null;
  };
  categoryData: Array<{ name: string; value: number }>;
  priorityData: Array<{ name: string; count: number }>;
};

export const AnalyticsView: React.FC = () => {
  const { language } = useApp();
  const [stats, setStats] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const result = await api.getAnalytics() as Analytics;
      setStats(result);
    } catch {
      setStats(null);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, []);

  const metrics = stats?.metrics;
  const cards = [
    { label: 'Total grievances', value: metrics?.total },
    { label: 'Resolved grievances', value: metrics?.resolved },
    { label: 'Pending grievances', value: metrics?.pending },
    { label: 'In progress', value: metrics?.inProgress },
    { label: 'Critical open cases', value: metrics?.critical },
    { label: 'High-priority open cases', value: metrics?.high },
    { label: 'Resolution rate', value: metrics?.resolutionRate == null ? null : `${metrics.resolutionRate}%` },
    { label: 'Average resolution time', value: metrics?.avgResolutionHours == null ? null : `${metrics.avgResolutionHours} hours` },
    { label: 'Citizen satisfaction', value: metrics?.citizenSatisfactionScore == null ? null : `${metrics.citizenSatisfactionScore}/5` },
  ];

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-indigo-600 p-3 text-white"><BarChart3 className="h-5 w-5" aria-hidden="true" /></span>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {language === 'ta' ? 'குறைதீர்ப்பு புள்ளிவிவரங்கள்' : 'Grievance Analytics'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {language === 'ta' ? 'தரவுத்தளத்தில் உள்ள பதிவுகளிலிருந்து கணக்கிடப்பட்டது.' : 'Calculated from records currently stored in the connected database.'}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => void loadAnalytics()} disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            {language === 'ta' ? 'புதுப்பிக்க' : 'Refresh'}
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">{language === 'ta' ? 'தரவை ஏற்ற முடியவில்லை' : 'Unable to load live analytics'}</p>
            <p className="mt-1 text-sm">{language === 'ta' ? 'இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.' : 'Check the database connection and try again. No demo statistics are shown.'}</p>
          </div>
        </div>
      )}

      <section aria-label="Grievance metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-600">{card.label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
              {isLoading ? '…' : card.value == null ? 'Not available' : card.value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-900">{language === 'ta' ? 'வகை வாரியான புகார்கள்' : 'Grievances by category'}</h3>
          {!isLoading && !error && (!stats?.categoryData?.length) && (
            <p className="mt-3 text-sm text-slate-600">{language === 'ta' ? 'இன்னும் புகார் பதிவுகள் இல்லை.' : 'No grievance records are available yet.'}</p>
          )}
          <ul className="mt-3 divide-y divide-slate-100">
            {stats?.categoryData?.map((item) => (
              <li key={item.name} className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="text-slate-700">{item.name}</span><span className="font-semibold tabular-nums text-slate-900">{item.value}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-900">{language === 'ta' ? 'முன்னுரிமை வாரியான புகார்கள்' : 'Grievances by priority'}</h3>
          {!isLoading && !error && (!stats?.priorityData?.some((item) => item.count > 0)) && (
            <p className="mt-3 text-sm text-slate-600">{language === 'ta' ? 'இன்னும் முன்னுரிமைத் தரவு இல்லை.' : 'No priority data is available yet.'}</p>
          )}
          <ul className="mt-3 divide-y divide-slate-100">
            {stats?.priorityData?.filter((item) => item.count > 0).map((item) => (
              <li key={item.name} className="flex items-center justify-between gap-4 py-2 text-sm">
                <span className="text-slate-700">{item.name}</span><span className="font-semibold tabular-nums text-slate-900">{item.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
};
