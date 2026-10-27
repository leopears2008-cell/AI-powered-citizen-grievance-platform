import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, X, Send, MessageCircle, FileText, Search, LoaderCircle, ExternalLink } from 'lucide-react';

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type Destination = 'file' | 'track';

type Props = { onNavigate: (destination: Destination) => void };

const WELCOME: ChatMessage = {
  role: 'assistant',
  content:
    'Vanakkam! I’m the NivaranAI Citizen Grievance Assistant. I can help you prepare a complaint, understand the filing process, or track an existing grievance. I can reply in English or Tamil. How can I help?',
};

const QUICK_PROMPTS = [
  { label: 'File a complaint', prompt: 'Help me prepare and file a civic complaint.', icon: FileText },
  { label: 'Track a grievance', prompt: 'Help me track an existing grievance.', icon: Search },
];

export const CitizenGrievanceAssistant: React.FC<Props> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isOpen, isSending]);

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isSending || text.length > 2000) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsSending(true);

    try {
      const response = await fetch('/api/ai/grievance-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.slice(-10).map(({ role, content }) => ({ role, content })),
        }),
      });

      const payload: { reply?: string; error?: string } = await response.json();
      if (!response.ok || !payload.reply) {
        throw new Error(payload.error || 'The assistant is temporarily unavailable.');
      }
      setMessages((current) => [...current, { role: 'assistant', content: payload.reply! }]);
    } catch {
      setError('Sorry, the assistant could not connect. Please try again, or use the File Complaint / Track Grievance pages.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <>
      {isOpen && (
        <section
          aria-label="NivaranAI Citizen Grievance Assistant"
          className="fixed bottom-24 right-4 z-[60] flex h-[min(640px,calc(100dvh-8rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        >
          <header className="flex items-center gap-3 bg-emerald-900 px-4 py-4 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
              <Bot className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold">Citizen Grievance Assistant</h2>
              <p className="text-xs text-emerald-100">NivaranAI · English and தமிழ்</p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close assistant" className="rounded-xl p-2 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4" aria-live="polite" aria-relevant="additions">
            <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-700">
              <p>For emergencies involving immediate danger, contact the relevant emergency service directly. Do not rely on this chat for emergency response.</p>
            </div>
            {messages.map((message, index) => (
              <div key={index} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={message.role === 'user'
                    ? 'max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-emerald-800 px-3 py-2.5 text-sm leading-relaxed text-white'
                    : 'max-w-[92%] whitespace-pre-wrap break-words rounded-2xl rounded-tl-md border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-700'}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex items-center gap-2 text-sm text-slate-500" role="status">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Preparing a helpful response…
              </div>
            )}
            {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
            <div ref={messageEndRef} />
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            {messages.length <= 1 && (
              <div className="mb-3 grid grid-cols-2 gap-2">
                {QUICK_PROMPTS.map(({ label, prompt, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      if (label === 'File a complaint') onNavigate('file');
                      if (label === 'Track a grievance') onNavigate('track');
                      void sendMessage(prompt);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 px-2 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-50"
                  >
                    <Icon className="h-4 w-4 shrink-0" /> {label}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <label className="sr-only" htmlFor="citizen-assistant-input">Your message</label>
              <textarea
                id="citizen-assistant-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage(input);
                  }
                }}
                maxLength={2000}
                rows={2}
                placeholder="Describe your issue… / உங்கள் பிரச்சினையை எழுதுங்கள்…"
                className="max-h-28 min-h-11 flex-1 resize-y rounded-2xl border border-slate-300 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                aria-label="Send message"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-800 text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
              AI-generated guidance may be incomplete. Verify official requirements before submitting. Do not share passwords, OTPs, or sensitive identity details.
            </p>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close citizen assistant' : 'Open citizen assistant'}
        aria-expanded={isOpen}
        className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-emerald-900 px-4 py-3 text-sm font-bold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span>{isOpen ? 'Close assistant' : 'Ask NivaranAI'}</span>
        {!isOpen && <ExternalLink className="h-3.5 w-3.5 opacity-70" />}
      </button>
    </>
  );
};

export default CitizenGrievanceAssistant;
