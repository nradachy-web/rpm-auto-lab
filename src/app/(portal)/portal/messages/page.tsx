'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  body: string;
  sender: 'customer' | 'admin' | 'system';
  createdAt: string;
}

export default function CustomerMessagesPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await api.get<{ messages: ChatMessage[] }>('/api/portal/messages');
    if (res.ok) setMessages(res.data?.messages ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    const res = await api.post('/api/portal/messages', { body: text.trim() });
    setSending(false);
    if (!res.ok) {
      alert(res.error || 'Failed to send');
      return;
    }
    setText('');
    load();
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-200px)] min-h-[480px]">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Messages</h1>
        <p className="text-rpm-silver mt-1">Chat directly with the shop.</p>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-xl border border-rpm-gray/40 bg-rpm-dark p-4 space-y-2">
        {loading && <div className="text-rpm-silver text-sm">Loading…</div>}
        {!loading && messages.length === 0 && (
          <div className="text-rpm-silver/70 text-sm italic">No messages yet. Say hello!</div>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} message={m} />
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="flex items-end gap-2"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          placeholder="Type a message…"
          rows={2}
          className="flex-1 px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white placeholder:text-rpm-silver/50 resize-none focus:outline-none focus:border-rpm-red"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="px-4 py-2 rounded-lg bg-rpm-red text-white font-bold disabled:opacity-50 flex items-center gap-1"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isMe = message.sender === 'customer';
  return (
    <div className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[75%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words',
        isMe ? 'bg-rpm-red/15 border border-rpm-red/30 text-rpm-white'
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
