'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { mockQuotes, getServiceName } from '@/data/mockData';

const QUOTE_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  PENDING: {
    label: 'Pending',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/30',
    dot: 'bg-yellow-400',
  },
  REVIEWED: {
    label: 'Reviewed',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/30',
    dot: 'bg-blue-400',
  },
  APPROVED: {
    label: 'Approved',
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    border: 'border-green-400/30',
    dot: 'bg-green-400',
  },
  DECLINED: {
    label: 'Declined',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/30',
    dot: 'bg-red-400',
  },
  EXPIRED: {
    label: 'Expired',
    color: 'text-rpm-silver',
    bg: 'bg-rpm-gray/30',
    border: 'border-rpm-gray/50',
    dot: 'bg-rpm-silver',
  },
};

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

function QuoteStatusBadge({ status }: { status: string }) {
  const config = QUOTE_STATUS_CONFIG[status] || QUOTE_STATUS_CONFIG.PENDING;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        config.color,
        config.bg,
        config.border
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}

export default function QuotesPage() {
  const [filter, setFilter] = useState<string>('ALL');

  const statuses = ['ALL', 'PENDING', 'REVIEWED', 'APPROVED', 'DECLINED'];
  const filteredQuotes =
    filter === 'ALL'
      ? mockQuotes
      : mockQuotes.filter((q) => q.status === filter);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-rpm-white">
            Quotes
          </h1>
          <p className="text-rpm-silver mt-1">
            View your quote history and request new ones.
          </p>
        </div>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-rpm-red text-white rounded-lg font-semibold text-sm hover:bg-rpm-red-dark transition-colors glow-red-hover"
        >
          <Plus className="w-4 h-4" />
          Request New Quote
        </Link>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-6"
      >
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer',
              filter === status
                ? 'bg-rpm-red text-white'
                : 'bg-rpm-gray/30 text-rpm-silver hover:text-rpm-white hover:bg-rpm-gray/50'
            )}
          >
            {status === 'ALL'
              ? 'All'
              : QUOTE_STATUS_CONFIG[status]?.label || status}
          </button>
        ))}
      </motion.div>

      {/* Quotes List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {filteredQuotes.length === 0 ? (
          <motion.div
            variants={cardVariants}
            className="bg-rpm-dark border border-rpm-gray/50 rounded-xl p-12 text-center"
          >
            <FileText className="w-10 h-10 text-rpm-silver mx-auto mb-3" />
            <p className="text-rpm-silver">
              No quotes found with this status.
            </p>
          </motion.div>
        ) : (
          filteredQuotes.map((quote) => (
            <motion.div
              key={quote.id}
              variants={cardVariants}
              className="bg-rpm-dark border border-rpm-gray/50 rounded-xl p-5 hover:border-rpm-gray transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Main Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-semibold text-rpm-white">
                      {quote.vehicle
                        ? `${quote.vehicle.year} ${quote.vehicle.make} ${quote.vehicle.model}`
                        : 'Unknown Vehicle'}
                    </h3>
                    <QuoteStatusBadge status={quote.status} />
                  </div>

                  {/* Services */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {quote.services.map((service) => (
                      <span
                        key={service}
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rpm-gray/50 text-rpm-light border border-rpm-gray"
                      >
                        {getServiceName(service)}
                      </span>
                    ))}
                  </div>

                  {/* Notes */}
                  {quote.notes && (
                    <p className="text-sm text-rpm-silver line-clamp-2">
                      {quote.notes}
                    </p>
                  )}
                </div>

                {/* Right Side - Date & Total */}
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 text-right shrink-0">
                  <p className="text-xs text-rpm-silver">
                    {quote.createdAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  {quote.total ? (
                    <p className="text-lg font-bold text-rpm-white">
                      ${quote.total.toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-sm text-rpm-silver italic">
                      Awaiting estimate
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
