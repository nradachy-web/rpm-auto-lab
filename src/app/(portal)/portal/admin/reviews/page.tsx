'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  body?: string | null;
  createdAt: string;
  user: { name: string; email: string };
  job?: { vehicle: { year: number; make: string; model: string } | null } | null;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await api.get<{ reviews: Review[] }>('/api/admin/reviews');
      if (res.ok) setReviews(res.data?.reviews ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-rpm-silver text-sm">Loading…</div>;

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-black text-rpm-white">Reviews</h1>
        <p className="text-rpm-silver mt-1">{reviews.length} reviews · avg {avg.toFixed(2)} ⭐️</p>
      </header>
      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-rpm-gray/40 p-8 text-rpm-silver/70 text-sm">
          No reviews yet.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <article key={r.id} className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-4">
              <header className="flex items-center justify-between mb-2">
                <div className="text-sm text-rpm-white font-bold">{r.user.name}</div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={cn('w-4 h-4', n <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-rpm-gray')} />
                  ))}
                </div>
              </header>
              {r.job?.vehicle && (
                <div className="text-xs text-rpm-silver mb-2">{r.job.vehicle.year} {r.job.vehicle.make} {r.job.vehicle.model}</div>
              )}
              {r.body && <p className="text-sm text-rpm-silver/90 whitespace-pre-wrap">{r.body}</p>}
              <div className="text-[11px] text-rpm-silver/60 mt-2">{new Date(r.createdAt).toLocaleString()}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
