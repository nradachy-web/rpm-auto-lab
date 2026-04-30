'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Send } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Customer { id: string; email: string; name: string; phone?: string | null }
interface ThreadSummary {
  id: string;
  customerId: string;
  lastMessageAt: string;
  unreadCount: number;
  customer: Customer;
  messages: { id: string; body: string; createdAt: string; sender: string }[];
}
interface ChatMessage { id: string; body: string; sender: 'customer' | 'admin' | 'system'; createdAt: string }

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={<div className="text-rpm-silver text-sm">Loading…</div>}>
      <AdminMessagesInner />
    </Suspense>
  );
}

function AdminMessagesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const activeId = params?.get('thread') ?? null;

  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    const res = await api.get<{ threads: ThreadSummary[] }>('/api/admin/messages');
    if (res.ok) setThreads(res.data?.threads ?? []);
    setLoading(false);
  }, []);

  const loadActive = useCallback(async (id: string) => {
    const res = await api.get<{ messages: ChatMessage[]; thread: { customer: Customer } }>(`/api/admin/messages/${id}`);
    if (res.ok) {
      setMessages(res.data?.messages ?? []);
      setActiveCustomer(res.data?.thread?.customer ?? null);
    }
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);
  useEffect(() => {
    if (activeId) loadActive(activeId);
  }, [activeId, loadActive]);
  useEffect(() => {
    const id = setInterval(() => {
      loadThreads();
      if (activeId) loadActive(activeId);
    }, 10000);
    return () => clearInterval(id);
  }, [loadThreads, loadActive, activeId]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const send = async () => {
    if (!activeId || !text.trim()) return;
    setSending(true);
    await api.post(`/api/admin/messages/${activeId}`, { body: text.trim() });
    setSending(false);
    setText('');
    loadActive(activeId);
    loadThreads();
  };

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Messages</h1>
        <p className="text-rpm-silver mt-1">Customer threads. New messages float to the top.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 min-h-0">
        <aside className="rounded-xl border border-rpm-gray/40 bg-rpm-dark overflow-y-auto">
          {threads.length === 0 && <div className="p-4 text-rpm-silver/70 text-sm italic">No threads yet.</div>}
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => router.replace(`/portal/admin/messages?thread=${t.id}`)}
              className={cn(
                'w-full text-left p-3 border-b border-rpm-gray/20 hover:bg-rpm-charcoal/50 transition',
                activeId === t.id && 'bg-rpm-charcoal/70'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold text-rpm-white truncate">{t.customer.name}</div>
                {t.unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rpm-red text-white text-[10px] font-bold tabular-nums">
                    {t.unreadCount}
                  </span>
                )}
              </div>
              <div className="text-xs text-rpm-silver truncate mt-0.5">{t.messages[0]?.body || 'No messages'}</div>
              <div className="text-[10px] text-rpm-silver/60 mt-0.5">{new Date(t.lastMessageAt).toLocaleString()}</div>
            </button>
          ))}
        </aside>

        <div className="md:col-span-2 flex flex-col min-h-0">
          {!activeId ? (
            <div className="flex-1 flex items-center justify-center rounded-xl border border-rpm-gray/40 bg-rpm-dark text-rpm-silver/70 text-sm">
              Pick a thread to start chatting.
            </div>
          ) : (
            <>
              <div className="rounded-t-xl border-x border-t border-rpm-gray/40 bg-rpm-charcoal/40 px-4 py-2 text-sm">
                <div className="font-bold text-rpm-white">{activeCustomer?.name ?? '—'}</div>
                <div className="text-xs text-rpm-silver">{activeCustomer?.email} {activeCustomer?.phone && `· ${activeCustomer.phone}`}</div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-b-xl border border-rpm-gray/40 bg-rpm-dark p-4 space-y-2">
                {messages.length === 0 && <div className="text-rpm-silver/70 text-sm italic">No messages.</div>}
                {messages.map((m) => (
                  <Bubble key={m.id} message={m} />
                ))}
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); send(); }}
                className="flex items-end gap-2 mt-2"
              >
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={2}
                  placeholder="Reply…"
                  className="flex-1 px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white placeholder:text-rpm-silver/50 resize-none focus:outline-none focus:border-rpm-red"
                />
                <button type="submit" disabled={sending || !text.trim()} className="px-4 py-2 rounded-lg bg-rpm-red text-white font-bold disabled:opacity-50 flex items-center gap-1">
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isAdmin = message.sender === 'admin';
  return (
    <div className={cn('flex', isAdmin ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[75%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words',
        isAdmin ? 'bg-rpm-red/15 border border-rpm-red/30 text-rpm-white'
                : 'bg-rpm-charcoal border border-rpm-gray/40 text-rpm-silver'
      )}>
        {message.body}
        <div className="text-[10px] text-rpm-silver/70 mt-1">
          {new Date(message.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
