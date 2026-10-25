import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowRight,
  FileText,
  Search,
  Bot,
  Building2,
  BrainCircuit,
  Activity,
  TrendingUp,
  Upload,
  MapPin,
  BarChart3,
  BadgeCheck,
  ShieldCheck,
  Landmark,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface Props {
  onOpenVoiceModal: () => void;
}

const quickAccess = [
  { key: 'file', title: 'File Complaint', desc: 'Register your grievance with ease', icon: FileText, bg: 'bg-red-100', fg: 'text-red-500' },
  { key: 'track', title: 'Track Grievance', desc: 'Check status using your Grievance ID', icon: Search, bg: 'bg-blue-100', fg: 'text-blue-500' },
  { key: 'ai', title: 'AI Assistant', desc: 'Get instant help with voice or text', icon: Bot, bg: 'bg-emerald-100', fg: 'text-emerald-500' },
  { key: 'directory', title: 'Departments', desc: 'Find the right department for your issue', icon: Building2, bg: 'bg-violet-100', fg: 'text-violet-500' },
];

const features = [
  { title: 'AI-Powered Analysis', desc: 'Smart categorization, duplicate check & prioritization', icon: BrainCircuit, bg: 'bg-violet-100', fg: 'text-violet-500' },
  { title: 'Real-time Tracking', desc: 'Live status updates with SLA monitoring', icon: Activity, bg: 'bg-blue-100', fg: 'text-blue-500' },
  { title: 'Automatic Escalation', desc: 'Escalates overdue cases to higher authorities', icon: TrendingUp, bg: 'bg-emerald-100', fg: 'text-emerald-500' },
  { title: 'Evidence Upload', desc: 'Support for images, documents and videos', icon: Upload, bg: 'bg-blue-100', fg: 'text-blue-500' },
  { title: 'Live Heatmap', desc: 'Visualize issue hotspots across Tamil Nadu', icon: MapPin, bg: 'bg-orange-100', fg: 'text-orange-500' },
  { title: 'Public Dashboard', desc: 'Transparency & open data for a better society', icon: BarChart3, bg: 'bg-emerald-100', fg: 'text-emerald-500' },
  { title: 'Citizen Verification', desc: 'Verify resolution & reopen if needed', icon: BadgeCheck, bg: 'bg-red-100', fg: 'text-red-400' },
  { title: 'Secure & Compliant', desc: 'Data security, audit logs and privacy protection', icon: ShieldCheck, bg: 'bg-teal-100', fg: 'text-teal-500' },
];

const news = [
  { title: 'TN Government Launches New Citizen Service Portal', tint: 'from-navy to-blue-800' },
  { title: 'New Grievance Redressal SLA Guidelines Released', tint: 'from-emerald-700 to-teal-600' },
  { title: 'AI Assistant Now Available in Tamil Language', tint: 'from-violet-700 to-indigo-600' },
  { title: '234 Constituency Directory Updated', tint: 'from-orange-600 to-amber-500' },
];

export const HomeLanding: React.FC<Props> = ({ onOpenVoiceModal }) => {
  const { language, setActiveTab } = useApp();
  const ta = language === 'ta';

  const handleQuick = (key: string) => {
    if (key === 'ai') onOpenVoiceModal();
    else setActiveTab(key as never);
  };

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="hero-gradient rounded-3xl border border-slate-200 px-6 sm:px-10 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <p className="text-xl sm:text-2xl font-medium text-blue-900">
              {ta ? 'உங்கள் குரல் முக்கியம்' : 'Your Voice Matters'}
            </p>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-navy">
              Nivaran<span className="text-ai">AI</span>
            </h1>
            <h2 className="text-lg sm:text-xl font-bold text-navy">
              AI-Powered Citizen Grievance Lodging and Tracking Platform
            </h2>
            <p className="text-slate-600 max-w-xl leading-relaxed">
              A transparent, accountable and responsive government for a better tomorrow.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setActiveTab('file')}
                className="bg-navy hover:bg-navy-dark text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg transition-colors inline-flex items-center space-x-2"
              >
                <span>{ta ? 'புகார் அளிக்க' : 'File a Complaint'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('track')}
                className="bg-white hover:bg-slate-50 text-navy border-2 border-navy px-6 py-3 rounded-full font-bold text-sm transition-colors"
              >
                {ta ? 'புகார் நிலை அறிய' : 'Track Your Grievance'}
              </button>
              <button
                onClick={onOpenVoiceModal}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-6 py-3 rounded-full font-bold text-sm transition-colors inline-flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{ta ? 'குரல் மூலம் புகார்' : 'Speak Your Complaint'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200">
              {[
                { icon: Landmark, a: '234', b: 'Constituencies' },
                { icon: Building2, a: 'All Departments', b: 'Integrated' },
                { icon: Clock, a: 'Real-time', b: 'Tracking' },
                { icon: Bot, a: 'AI-Powered', b: 'Assistance' },
              ].map((x) => (
                <div key={x.a} className="flex items-center space-x-2.5 bg-white/80 p-2.5 rounded-xl border border-slate-200">
                  <span className="w-9 h-9 rounded-full bg-sky-tint text-navy flex items-center justify-center shrink-0">
                    <x.icon className="w-4 h-4" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-xs font-bold text-navy">{x.a}</p>
                    <p className="text-[11px] text-slate-500">{x.b}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-linear-to-tr from-navy to-blue-900 rounded-3xl p-6 text-white shadow-2xl border-4 border-white min-h-[360px] flex flex-col justify-between">
              <div className="bg-white/10 px-4 py-2 rounded-xl text-center border border-white/20">
                <p className="text-yellow-400 font-bold tracking-wide text-sm">தமிழ்நாடு அரசு தலைமைச் செயலகம்</p>
                <p className="text-xs text-slate-200">Government of Tamil Nadu Secretariat</p>
              </div>
              <div className="my-6 space-y-4">
                <div className="bg-white text-slate-900 p-4 rounded-2xl shadow-xl flex items-center space-x-3 border-l-4 border-emerald-500">
                  <CheckCircle2 className="w-9 h-9 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">Grievance Resolved</p>
                    <p className="text-[11px] text-slate-500">Public Works Department • Action taken in 24 hrs</p>
                  </div>
                </div>
                <div className="bg-white/90 text-slate-900 p-4 rounded-2xl shadow-xl flex items-center space-x-3 border-l-4 border-blue-500">
                  <Bot className="w-9 h-9 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold">AI Auto-Categorized & Escalated</p>
                    <p className="text-[11px] text-slate-500">Chennai Corporation → Zonal Officer</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300 border-t border-white/10 pt-3">
                <span>Secure portal</span>
                <span className="text-emerald-400 font-semibold">• Systems Operational</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-navy">Quick Access</h2>
          <p className="text-sm text-slate-500">Get started with our citizen services</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickAccess.map((q) => (
            <button
              key={q.key}
              onClick={() => handleQuick(q.key)}
              className="group text-left bg-white p-6 rounded-2xl border border-slate-200 shadow-card hover:shadow-md transition-all flex flex-col justify-between min-h-[180px]"
            >
              <div>
                <div className={`w-12 h-12 rounded-xl ${q.bg} ${q.fg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <q.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-navy text-lg mb-1">{q.title}</h3>
                <p className="text-slate-600 text-xs leading-relaxed">{q.desc}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-navy mt-4" />
            </button>
          ))}
        </div>
      </section>

      {/* Why NivaranAI */}
      <section className="bg-linear-to-r from-blue-50 via-sky-50 to-white rounded-3xl p-8 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center border border-slate-200">
        <div className="space-y-4">
          <h2 className="text-3xl font-extrabold text-navy">Why NivaranAI?</h2>
          <p className="text-lg font-semibold text-blue-900">Smarter Governance. Happier Citizens.</p>
          <p className="text-slate-600 leading-relaxed">
            NivaranAI uses the power of Artificial Intelligence to make grievance redressal faster, easier and more
            transparent. We connect citizens with the right departments, track progress in real-time and ensure
            accountability at every step.
          </p>
          <button
            onClick={() => setActiveTab('analytics')}
            className="bg-navy hover:bg-navy-dark text-white px-6 py-3 rounded-full font-bold text-sm inline-flex items-center space-x-2"
          >
            <span>Learn More</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="relative min-h-[220px] rounded-2xl bg-linear-to-br from-sky-100 to-emerald-50 border border-white flex items-center justify-center">
          <Landmark className="w-24 h-24 text-navy/20" />
          <div className="absolute bottom-5 left-5 bg-white/90 backdrop-blur rounded-full pl-3 pr-5 py-2 shadow-lg flex items-center space-x-2 border border-slate-200">
            <CheckCircle2 className="w-5 h-5 text-ai" />
            <span className="text-xs font-semibold text-navy">Your grievance is under review</span>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-navy">Key Features</h2>
          <p className="text-sm text-slate-500">Everything you need for a better grievance management experience</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white rounded-2xl border border-slate-200 overflow-hidden gap-px bg-slate-200">
          {features.map((f) => (
            <div key={f.title} className="bg-white p-6 space-y-3">
              <div className={`w-11 h-11 rounded-xl ${f.bg} ${f.fg} flex items-center justify-center`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-navy">{f.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Impact banner */}
      <section className="rounded-2xl overflow-hidden bg-linear-to-r from-navy-dark via-navy to-blue-900 p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white">Together for a Better Tamil Nadu</h2>
          <p className="text-slate-200">Your grievance today, a better tomorrow.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl grid grid-cols-3 divide-x divide-slate-200 text-center">
          {[
            { icon: MapPin, v: '234', l: 'Constituencies' },
            { icon: Building2, v: '38+', l: 'Departments' },
            { icon: ShieldCheck, v: '100%', l: 'Transparency' },
          ].map((s) => (
            <div key={s.l} className="px-5 sm:px-8 py-5">
              <s.icon className="w-5 h-5 text-ai mx-auto mb-1" />
              <p className="text-2xl font-extrabold text-navy">{s.v}</p>
              <p className="text-[11px] text-slate-500">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* News */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-navy">Latest News &amp; Updates</h2>
          <p className="text-sm text-slate-500">Stay informed with the latest government updates and announcements.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {news.map((n) => (
            <article key={n.title} className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden flex flex-col">
              <div className={`h-40 bg-linear-to-br ${n.tint}`} />
              <div className="p-4 flex flex-col flex-1 space-y-2">
                <span className="inline-flex items-center space-x-1 text-[11px] text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>15 Oct 2025</span>
                </span>
                <h3 className="font-bold text-navy text-sm leading-snug flex-1">{n.title}</h3>
                <span className="text-xs font-semibold text-action inline-flex items-center space-x-1">
                  <span>Read More</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
