'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="text-rpm-silver text-sm">Loading…</div>}>
      <ReviewInner />
    </Suspense>
  );
}

function ReviewInner() {
  const params = useSearchParams();
  const router = useRouter();
  const jobId = params?.get('job') ?? undefined;
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!rating) return;
    setSubmitting(true);
    const res = await api.post('/api/portal/reviews', { jobId, rating, body: body || undefined });
    setSubmitting(false);
    if (!res.ok) {
      alert(res.error || 'Submit failed');
      return;
    }
    setDone(true);
    setTimeout(() => router.push('/portal/dashboard'), 2000);
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-12">
        <div className="text-5xl">⭐️</div>
        <h1 className="text-2xl font-black text-rpm-white">Thanks for the feedback!</h1>
        <p className="text-rpm-silver">We really appreciate it.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 py-6">
      <header>
        <h1 className="text-3xl font-black text-rpm-white">How did we do?</h1>
        <p className="text-rpm-silver mt-1">Pick a rating and (optionally) tell us what stood out.</p>
      </header>

      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            className="p-1"
            aria-label={`${n} stars`}
          >
            <Star className={cn(
              'w-10 h-10 transition',
              (hover || rating) >= n ? 'text-amber-400 fill-amber-400' : 'text-rpm-gray'
            )} />
          </button>
        ))}
      </div>

      <textarea
        rows={5}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Optional — tell us about your experience"
        className="w-full px-3 py-2 rounded-lg bg-rpm-charcoal border border-rpm-gray text-sm text-rpm-white resize-none focus:outline-none focus:border-rpm-red"
      />

      <button
        onClick={submit}
        disabled={!rating || submitting}
        className="w-full px-4 py-3 rounded-lg bg-rpm-red text-white font-bold hover:bg-rpm-red-dark disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit review'}
      </button>
    </div>
  );
}
