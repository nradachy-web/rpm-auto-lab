'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Wrench,
  FileText,
  Car,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import {
  mockUser,
  mockJobs,
  mockQuotes,
  mockVehicles,
  mockActivity,
} from '@/data/mockData';

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

const stats = [
  {
    label: 'Active Jobs',
    value: mockJobs.filter((j) => j.status === 'IN_PROGRESS' || j.status === 'SCHEDULED').length,
    icon: Wrench,
    color: 'text-rpm-red',
    bg: 'bg-rpm-red/10',
    href: '/portal/jobs',
  },
  {
    label: 'Pending Quotes',
    value: mockQuotes.filter((q) => q.status === 'PENDING' || q.status === 'REVIEWED').length,
    icon: FileText,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    href: '/portal/quotes',
  },
  {
    label: 'Vehicles',
    value: mockVehicles.length,
    icon: Car,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
    href: '/portal/vehicles',
  },
];

function getActivityIcon(type: string) {
  switch (type) {
    case 'job_completed':
    case 'job_picked_up':
    case 'quote_approved':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'job_update':
      return <Clock className="w-4 h-4 text-blue-400" />;
    case 'quote_received':
      return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    default:
      return <Clock className="w-4 h-4 text-rpm-silver" />;
  }
}

function formatRelativeDate(date: Date): string {
  const now = new Date('2026-03-24T12:00:00');
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-rpm-white">
          Welcome back, {mockUser.name?.split(' ')[0]}
        </h1>
        <p className="text-rpm-silver mt-1">
          Here&apos;s what&apos;s happening with your vehicles.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={cardVariants}>
            <Link
              href={stat.href}
              className="block bg-rpm-dark border border-rpm-gray/50 rounded-xl p-5 hover:border-rpm-gray transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <ChevronRight className="w-4 h-4 text-rpm-silver opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-3xl font-bold text-rpm-white">{stat.value}</p>
              <p className="text-sm text-rpm-silver mt-1">{stat.label}</p>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="lg:col-span-2"
        >
          <motion.div
            variants={cardVariants}
            className="bg-rpm-dark border border-rpm-gray/50 rounded-xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-rpm-gray/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-rpm-white">
                Recent Activity
              </h2>
              <Link
                href="/portal/jobs"
                className="text-sm text-rpm-red hover:text-rpm-red-glow transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-rpm-gray/30">
              {mockActivity.map((event) => (
                <div
                  key={event.id}
                  className="px-5 py-4 flex items-start gap-3 hover:bg-rpm-gray/20 transition-colors"
                >
                  <div className="mt-0.5">{getActivityIcon(event.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-rpm-light">{event.message}</p>
                    <p className="text-xs text-rpm-silver mt-1">
                      {formatRelativeDate(event.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div
            variants={cardVariants}
            className="bg-rpm-dark border border-rpm-gray/50 rounded-xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-rpm-gray/50">
              <h2 className="text-lg font-semibold text-rpm-white">
                Quick Actions
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <Link
                href="/contact"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-rpm-red/10 border border-rpm-red/20 text-rpm-red hover:bg-rpm-red/20 transition-colors group"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">Request New Quote</span>
                <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/portal/vehicles"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-rpm-gray/30 border border-rpm-gray/50 text-rpm-light hover:bg-rpm-gray/50 transition-colors group"
              >
                <Car className="w-5 h-5" />
                <span className="text-sm font-medium">Add Vehicle</span>
                <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </motion.div>

          {/* Current Active Job Preview */}
          {mockJobs.filter((j) => j.status === 'IN_PROGRESS').length > 0 && (
            <motion.div variants={cardVariants} className="mt-4">
              <div className="bg-rpm-dark border border-rpm-red/20 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-rpm-gray/50 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rpm-red animate-pulse" />
                  <h2 className="text-lg font-semibold text-rpm-white">
                    In Progress
                  </h2>
                </div>
                {mockJobs
                  .filter((j) => j.status === 'IN_PROGRESS')
                  .map((job) => (
                    <Link
                      key={job.id}
                      href="/portal/jobs"
                      className="block px-5 py-4 hover:bg-rpm-gray/20 transition-colors"
                    >
                      <p className="text-sm font-medium text-rpm-white">
                        {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
                      </p>
                      <p className="text-xs text-rpm-silver mt-1">
                        {job.services
                          .map((s) =>
                            s
                              .split('-')
                              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(' ')
                          )
                          .join(' + ')}
                      </p>
                    </Link>
                  ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
