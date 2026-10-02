import React, { useMemo, useState } from 'react';
import { Bot, Send, Sparkles, Search, FileText, Clock3, ArrowUpRight, X } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; text: string };
type ComplaintStep = 'problem' | 'location' | 'action' | 'review';


interface GrievanceChatbotProps { onStartComplaint: (draft: string) => void; }

const quickActions = [
  { label: 'Submit a grievance', icon: FileText, prompt: 'START_COMPLAINT_FLOW' },
  { label: 'Write my complaint', icon: Sparkles, prompt: 'Help me turn my rough complaint into a clear grievance draft.' },
  { label: 'Check SLA', icon: Clock3, prompt: 'Explain how grievance SLA and resolution deadlines work.' },
  { label: 'Track my grievance', icon: Search, prompt: 'I want to track an existing grievance.' },
];

export const GrievanceChatbot: React.FC<GrievanceChatbotProps> = ({ onStartComplaint }) => {
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [complaintMode, setComplaintMode] = useState(false);
  const [complaintStep, setComplaintStep] = useState<ComplaintStep>('problem');
  const [complaint, setComplaint] = useState({ problem: '', location: '', action: '' });
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Hello! I’m the NivaranAI Citizen Assistant. I can help you write a grievance, understand the filing process, explain SLA information, or guide you to track an existing grievance.',
    },
  ]);

  const apiBase = useMemo(() => (import.meta.env.VITE_API_URL || '').replace(/\/$/, ''), []);

  function startComplaintFlow() {
    setComplaintMode(true);
    setComplaintStep('problem');
    setComplaint({ problem: '', location: '', action: '' });
    setMessages((current) => [...current, {
      role: 'assistant',
      text: 'Let’s file your complaint step by step. Step 1 of 4: What problem do you want to report? Include the main issue and important facts.',
    }]);
  }

  function finishComplaint() {
    const draft = [
      `Complaint: ${complaint.problem.trim()}`,
      `Location: ${complaint.location.trim()}`,
      `Requested action: ${complaint.action.trim()}`,
    ].join('\\n');
    onStartComplaint(draft);
    setComplaintMode(false);
    setComplaintStep('problem');
    setMessages((current) => [...current, {
      role: 'assistant',
      text: 'Your complaint details are ready. I’ve opened the official grievance form with your information. Please review the details, add any required contact/evidence information, and submit it there.',
    }]);
  }

  function nextComplaintStep() {
    const value = complaint[complaintStep === 'problem' ? 'problem' : complaintStep === 'location' ? 'location' : 'action'].trim();
    if (!value) return;
    if (complaintStep === 'problem') setComplaintStep('location');
    else if (complaintStep === 'location') setComplaintStep('action');
    else if (complaintStep === 'action') setComplaintStep('review');
  }

  function complaintBack() {
    if (complaintStep === 'location') setComplaintStep('problem');
    else if (complaintStep === 'action') setComplaintStep('location');
    else if (complaintStep === 'review') setComplaintStep('action');
  }

  async function sendMessage(message: string) {
    if (message === 'START_COMPLAINT_FLOW') {
      startComplaintFlow();
      return;
    }
    const trimmed = message.trim();
    if (!trimmed || busy) return;

    const nextMessages = [...messages, { role: 'user' as const, text: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setBusy(true);

    try {
      const response = await fetch(`${apiBase}/api/ai/grievance-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-8),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Assistant request failed.');
      setMessages((current) => [...current, { role: 'assistant', text: data.reply || 'Please try again.' }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: error instanceof Error ? error.message : 'The assistant is temporarily unavailable.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="grievance-assistant-title" className="rounded-2xl border border-indigo-100 bg-white shadow-sm overflow-hidden">
      <div className="p-5 sm:p-7 bg-gradient-to-r from-indigo-50 via-white to-sky-50 border-b border-indigo-100">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Bot className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 id="grievance-assistant-title" className="text-lg sm:text-xl font-black text-slate-900">Citizen Grievance AI Assistant</h2>
              
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">Write complaints clearly, understand the process, and get guided to the right page.</p>
          </div>
          <button
            type="button"
            onClick={() => onStartComplaint('')}
            className="hidden sm:inline-flex shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700"
          >
            File real complaint
          </button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="grievance-assistant-panel"
            className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:text-indigo-700 hover:border-indigo-200"
          >
            {open ? <X className="w-4 h-4" aria-hidden="true" /> : <ArrowUpRight className="w-4 h-4" aria-hidden="true" />}
            <span className="sr-only">{open ? 'Close assistant' : 'Open assistant'}</span>
          </button>
        </div>
      </div>

      {open && (
        <div id="grievance-assistant-panel" className="p-4 sm:p-6">
          {complaintMode && (
            <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4" aria-label="Step-by-step complaint form">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-indigo-700">Complaint filing — step {complaintStep === 'problem' ? 1 : complaintStep === 'location' ? 2 : complaintStep === 'action' ? 3 : 4} of 4</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {complaintStep === 'problem' && 'What happened?'}
                    {complaintStep === 'location' && 'Where did it happen?'}
                    {complaintStep === 'action' && 'What should be done?'}
                    {complaintStep === 'review' && 'Review your complaint'}
                  </p>
                </div>
                <button type="button" onClick={() => setComplaintMode(false)} className="text-xs font-semibold text-slate-500 hover:text-slate-800">Cancel</button>
              </div>

              {complaintStep === 'problem' && (
                <textarea value={complaint.problem} onChange={(e) => setComplaint((x) => ({ ...x, problem: e.target.value.slice(0, 3000) }))} rows={4} maxLength={3000} placeholder="Example: Describe the civic problem, what happened, and when it happened." className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              )}
              {complaintStep === 'location' && (
                <textarea value={complaint.location} onChange={(e) => setComplaint((x) => ({ ...x, location: e.target.value.slice(0, 1000) }))} rows={3} maxLength={1000} placeholder="Area, street, ward, village/town, district, or other useful location details." className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              )}
              {complaintStep === 'action' && (
                <textarea value={complaint.action} onChange={(e) => setComplaint((x) => ({ ...x, action: e.target.value.slice(0, 1500) }))} rows={3} maxLength={1500} placeholder="What action or resolution are you requesting?" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              )}
              {complaintStep === 'review' && (
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="rounded-xl bg-white border border-slate-200 p-3"><b>Problem:</b><p className="mt-1 whitespace-pre-wrap">{complaint.problem}</p></div>
                  <div className="rounded-xl bg-white border border-slate-200 p-3"><b>Location:</b><p className="mt-1 whitespace-pre-wrap">{complaint.location}</p></div>
                  <div className="rounded-xl bg-white border border-slate-200 p-3"><b>Requested action:</b><p className="mt-1 whitespace-pre-wrap">{complaint.action}</p></div>
                </div>
              )}

              <div className="mt-3 flex justify-between gap-2">
                <button type="button" onClick={complaintBack} disabled={complaintStep === 'problem'} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-40">Back</button>
                {complaintStep === 'review'
                  ? <button type="button" onClick={finishComplaint} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700">Continue to official form</button>
                  : <button type="button" onClick={nextComplaintStep} disabled={!complaint[complaintStep === 'problem' ? 'problem' : complaintStep === 'location' ? 'location' : 'action'].trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-40">Next step</button>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {quickActions.map(({ label, icon: Icon, prompt }) => (
              <button
                key={label}
                type="button"
                disabled={busy}
                onClick={() => void sendMessage(prompt)}
                className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 p-3 text-left text-[11px] font-semibold text-slate-700 disabled:opacity-50"
              >
                <Icon className="w-4 h-4 text-indigo-600 mb-2" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <div aria-live="polite" className="h-80 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
            {messages.map((message, index) => (
              <div key={index} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md'
                }`}>
                  {message.text}
                </div>
              </div>
            ))}
            {busy && <div className="text-xs text-slate-500 px-2">Preparing a response…</div>}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
            className="mt-3 flex gap-2"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={4000}
              disabled={busy}
              placeholder="Describe your issue or ask a question…"
              aria-label="Message the grievance assistant"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send message"
              className="rounded-xl bg-indigo-600 px-4 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Send className="w-5 h-5" aria-hidden="true" />
            </button>
          </form>

          {!complaintMode && <button type="button" onClick={startComplaintFlow} className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700">File complaint step by step</button>}

          <p className="mt-3 text-[10px] text-slate-400">
            AI responses are guidance only. It cannot approve, reject, assign, resolve, or change a government grievance.
          </p>
        </div>
      )}
    </section>
  );
};
