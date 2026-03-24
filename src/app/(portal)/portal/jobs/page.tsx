'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Wrench,
  Clock,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { mockJobs, getServiceName } from '@/data/mockData';
import type { MockJob } from '@/data/mockData';

const JOB_STAGES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'PICKED_UP'] as const;

const STAGE_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  PICKED_UP: 'Picked Up',
};

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; dot: string }
> = {
  SCHEDULED: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/30',
    dot: 'bg-yellow-400',
  },
  IN_PROGRESS: {
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/30',
    dot: 'bg-blue-400',
  },
  COMPLETED: {
    color: 'text-green-400',
    bg: 'bg-green-400/10',
    border: 'border-green-400/30',
    dot: 'bg-green-400',
  },
  PICKED_UP: {
    color: 'text-rpm-silver',
    bg: 'bg-rpm-gray/30',
    border: 'border-rpm-gray/50',
    dot: 'bg-rpm-silver',
  },
};

function getStageIndex(status: string): number {
  return JOB_STAGES.indexOf(status as (typeof JOB_STAGES)[number]);
}

function ProgressPipeline({ status }: { status: string }) {
  const currentIndex = getStageIndex(status);

  return (
    <div className="flex items-center gap-1 w-full">
      {JOB_STAGES.map((stage, i) => {
        const isReached = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={stage} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className={cn(
                'h-1.5 w-full rounded-full transition-colors',
                isReached ? 'bg-rpm-red' : 'bg-rpm-gray'
              )}
            />
            <span
              className={cn(
                'text-[10px] sm:text-xs font-medium whitespace-nowrap',
                isCurrent ? 'text-rpm-red' : isReached ? 'text-rpm-light' : 'text-rpm-silver'
              )}
            >
              {STAGE_LABELS[stage]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.SCHEDULED;
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
      {STAGE_LABELS[status] || status}
    </span>
  );
}

function JobCard({ job, index }: { job: MockJob; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-rpm-dark border border-rpm-gray/50 rounded-xl overflow-hidden hover:border-rpm-gray transition-colors"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-rpm-white">
              {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
            </h3>
            <p className="text-sm text-rpm-silver mt-0.5">
              {job.services.map(getServiceName).join(' + ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={job.status} />
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-rpm-silver" />
            </motion.div>
          </div>
        </div>

        {/* Progress Pipeline */}
        <ProgressPipeline status={job.status} />
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-rpm-gray/30 space-y-4">
              {/* Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {job.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-rpm-silver" />
                    <div>
                      <p className="text-[10px] text-rpm-silver uppercase tracking-wider">
                        Start Date
                      </p>
                      <p className="text-sm text-rpm-light">
                        {job.startDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {job.endDate && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-rpm-silver" />
                    <div>
                      <p className="text-[10px] text-rpm-silver uppercase tracking-wider">
                        Completed
                      </p>
                      <p className="text-sm text-rpm-light">
                        {job.endDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {job.total && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-rpm-silver" />
                    <div>
                      <p className="text-[10px] text-rpm-silver uppercase tracking-wider">
                        Total
                      </p>
                      <p className="text-sm text-rpm-light font-medium">
                        ${job.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-rpm-silver" />
                  <div>
                    <p className="text-[10px] text-rpm-silver uppercase tracking-wider">
                      Services
                    </p>
                    <p className="text-sm text-rpm-light">
                      {job.services.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <p className="text-xs text-rpm-silver uppercase tracking-wider mb-2">
                  Services Included
                </p>
                <div className="flex flex-wrap gap-2">
                  {job.services.map((service) => (
                    <span
                      key={service}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-rpm-gray/50 text-rpm-light border border-rpm-gray"
                    >
                      {getServiceName(service)}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {job.notes && (
                <div>
                  <p className="text-xs text-rpm-silver uppercase tracking-wider mb-1">
                    Notes
                  </p>
                  <p className="text-sm text-rpm-light">{job.notes}</p>
                </div>
              )}

              {/* Photos Placeholder */}
              <div>
                <p className="text-xs text-rpm-silver uppercase tracking-wider mb-2">
                  Photos
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-20 h-20 rounded-lg bg-rpm-gray/50 border border-rpm-gray flex items-center justify-center"
                    >
                      <span className="text-rpm-silver text-xs">No photo</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function JobsPage() {
  const [filter, setFilter] = useState<string>('ALL');

  const filteredJobs =
    filter === 'ALL' ? mockJobs : mockJobs.filter((j) => j.status === filter);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-rpm-white">
          My Jobs
        </h1>
        <p className="text-rpm-silver mt-1">
          Track your vehicle service progress in real time.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-wrap gap-2 mb-6"
      >
        {['ALL', ...JOB_STAGES].map((status) => (
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
            {status === 'ALL' ? 'All' : STAGE_LABELS[status]}
          </button>
        ))}
      </motion.div>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-rpm-dark border border-rpm-gray/50 rounded-xl p-12 text-center"
          >
            <Clock className="w-10 h-10 text-rpm-silver mx-auto mb-3" />
            <p className="text-rpm-silver">
              No jobs found with this status.
            </p>
          </motion.div>
        ) : (
          filteredJobs.map((job, i) => (
            <JobCard key={job.id} job={job} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
