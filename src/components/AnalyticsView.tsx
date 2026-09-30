import React, { useEffect, useState } from 'react';
import { BarChart3, Clock, ThumbsUp, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

type Analytics = Awaited<ReturnType<typeof api.getAnalytics>>;

export const AnalyticsView: React.FC = () => {
  const { showToast } = useApp();
  const [stats, setStats] = useState<Analytics | null>(null);

  useEffect(() => {
    api.getAnalytics().then(setStats).catch((error) => {
      showToast(error instanceof Error ? error.message : 'Unable to load analytics.', 'error');
    });
  }, []);

  if (!stats) {
    return <div className="py-16 text-center text-sm text-slate-500" role="status">Loading dashboard data…</div>;
  }

  const metric = stats.metrics;

  return (
    <section className="space-y-6" aria-labelledby="analytics-title">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-indigo-600 text-white rounded-xl"><BarChart3 className="w-5 h-5" aria-hidden="true" /></span>
          <div>
            <h1 id="analytics-title" className="text-xl font-bold text-slate-900">Operational analytics</h1>
            <p className="text-xs text-slate-500">Calculated from the grievances currently accessible to the authenticated administrator.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={<ShieldCheck className="w-4 h-4" />} label="Total" value={metric.total} />
        <Card icon={<ShieldCheck className="w-4 h-4" />} label="Resolved" value={metric.resolved} />
        <Card icon={<Clock className="w-4 h-4" />} label="Avg resolution hours" value={metric.avgResolutionHours ?? '—'} />
        <Card icon={<ThumbsUp className="w-4 h-4" />} label="Satisfaction / 5" value={metric.citizenSatisfactionScore ?? '—'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DataList title="Categories" rows={stats.categoryData.map((x) => [x.name, x.value])} />
        <DataList title="Priorities" rows={stats.priorityData.map((x) => [x.name, x.value])} />
        <DataList title="Districts" rows={stats.districtData.map((x) => [x.district, x.total])} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Last 7 days</h2>
        <div className="grid grid-cols-7 gap-2 items-end min-h-40">
          {stats.timelineData.map((item) => {
            const max = Math.max(1, ...stats.timelineData.map((x) => Math.max(x.submitted, x.resolved)));
            return (
              <div key={item.day} className="flex flex-col justify-end items-center h-40 gap-1">
                <div className="text-[10px] text-slate-500">{item.submitted}</div>
                <div
                  className="w-full max-w-10 bg-indigo-600 rounded-t-md"
                  style={{ height: `${Math.max(4, (item.submitted / max) * 100)}%` }}
                  title={`${item.submitted} submitted`}
                />
                <span className="text-[10px] text-slate-500">{item.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const Card = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
    <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold uppercase">{icon}{label}</div>
    <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">{value}</p>
  </div>
);

const DataList = ({ title, rows }: { title: string; rows: Array<[string, number]> }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5">
    <h2 className="text-sm font-bold text-slate-900 mb-3">{title}</h2>
    <div className="space-y-2">
      {rows.length ? rows.map(([name, value]) => (
        <div key={name} className="flex justify-between gap-4 text-xs border-b border-slate-100 pb-2">
          <span className="text-slate-600">{name}</span><strong className="text-slate-900">{value}</strong>
        </div>
      )) : <p className="text-xs text-slate-400">No data available.</p>}
    </div>
  </div>
);
