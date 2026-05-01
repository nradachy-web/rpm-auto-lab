'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PublicReview {
  id: string;
  rating: number;
  body?: string | null;
  publishedAt: string;
  firstName: string;
  vehicle: string | null;
}

export default function ReviewsWidget({ limit = 6 }: { limit?: number }) {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await api.get<{ reviews: PublicReview[] }>('/api/reviews/public');
      if (res.ok) setReviews((res.data?.reviews ?? []).slice(0, limit));
      setLoading(false);
    })();
  }, [limit]);

  if (loading) return null;
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <section className="py-16 md:py-24 px-4 bg-rpm-charcoal">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-10">
          <div className="text-xs uppercase tracking-[0.25em] text-rpm-red font-bold mb-2">Real customers</div>
          <h2 className="text-3xl md:text-5xl font-black text-rpm-white">What they say</h2>
          <div className="flex items-center justify-center gap-2 mt-3 text-rpm-silver">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={cn('w-4 h-4', n <= Math.round(avg) ? 'text-amber-400 fill-amber-400' : 'text-rpm-gray')} />
              ))}
            </div>
            <span className="text-sm tabular-nums">{avg.toFixed(1)} avg</span>
          </div>
        </header>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {reviews.map((r) => (
            <motion.article
              key={r.id}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
              className="rounded-xl border border-rpm-gray/40 bg-rpm-dark p-5"
            >
              <div className="flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={cn('w-3.5 h-3.5', n <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-rpm-gray')} />
                ))}
              </div>
              {r.body && <p className="mt-3 text-rpm-silver text-sm leading-relaxed">&ldquo;{r.body}&rdquo;</p>}
              <footer className="mt-4 pt-3 border-t border-rpm-gray/30 text-xs text-rpm-silver">
                <span className="text-rpm-white font-bold">{r.firstName}</span>
                {r.vehicle && <span> · {r.vehicle}</span>}
                <div className="text-[11px] text-rpm-silver/70 mt-0.5">{new Date(r.publishedAt).toLocaleDateString()}</div>
              </footer>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
