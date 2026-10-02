import React, { useMemo, useState } from 'react';
import { Bot, Send, Sparkles, Search, FileText, Clock3, ArrowUpRight, X } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; text: string };

const quickActions = [
  { label: 'Submit a grievance', icon: FileText, prompt: 'Help me submit a civic grievance.' },
  { label: 'Write my complaint', icon: Sparkles, prompt: 'Help me turn my rough complaint into a clear grievance draft.' },
  { label: 'Check SLA', icon: Clock3, prompt: 'Explain how grievance SLA and resolution deadlines work.' },
  { label: 'Track my grievance', icon: Search, prompt: 'I want to track an existing grievance.' },
];

export const GrievanceChatbot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Hello! I’m the NivaranAI Citizen Assistant. I can help you write a grievance, understand the filing process, explain SLA information, or guide you to track an existing grievance.',
    },
  ]);

  const apiBase = useMemo(() => (import.meta.env.VITE_API_URL || '').replace(/\/$/, ''), []);

  async function sendMessage(message: string) {
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

          <p className="mt-3 text-[10px] text-slate-400">
            AI responses are guidance only. It cannot approve, reject, assign, resolve, or change a government grievance.
          </p>
        </div>
      )}
    </section>
  );
};
