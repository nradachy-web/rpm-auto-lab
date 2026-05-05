'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Car,
  Wrench,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Shield,
  Calendar,
  CalendarPlus,
  Tag,
  MessageSquare,
  Receipt,
  Users,
  BarChart3,
  Package,
  Megaphone,
  HardHat,
  Gift,
  Kanban,
  Star,
  Store,
  Percent,
} from 'lucide-react';
import { api, setAuthToken } from '@/lib/api';
import GlobalSearch from '@/components/portal/GlobalSearch';
import PWARegister from '@/components/portal/PWARegister';

interface SessionUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'customer' | 'admin';
}

// CUSTOMER nav: 5 daily items + Settings. Vehicles/Jobs/Quotes are folded
// into "My Garage" (a single page). Rewards lives inside Settings.
const customerNav = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portal/book', label: 'Book', icon: CalendarPlus },
  { href: '/portal/garage', label: 'My Garage', icon: Car },
  { href: '/portal/messages', label: 'Messages', icon: MessageSquare },
  { href: '/portal/invoices', label: 'Pay', icon: Receipt },
  { href: '/portal/settings', label: 'Settings', icon: Settings },
] as const;

// Admin nav reorganized around the verbs of running a detail/PPF shop:
// (1) the daily spine, (2) people + money, (3) growth tools, (4) setup.
// Each section is collapsible; the spine stays open by default.
type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };
type NavGroup = { id: string; label: string; defaultOpen: boolean; items: readonly NavItem[] };

const ADMIN_NAV: readonly NavGroup[] = [
  {
    id: 'daily',
    label: 'Daily work',
    defaultOpen: true,
    items: [
      { href: '/portal/admin', label: 'Today', icon: Shield },
      { href: '/portal/admin/schedule', label: 'Schedule', icon: Calendar },
      { href: '/portal/admin/bay', label: 'Bay (Tech)', icon: HardHat },
      { href: '/portal/admin/pipeline', label: 'Pipeline', icon: Kanban },
    ],
  },
  {
    id: 'people-money',
    label: 'People & money',
    defaultOpen: true,
    items: [
      { href: '/portal/admin/customers', label: 'Customers', icon: Users },
      { href: '/portal/admin/messages', label: 'Messages', icon: MessageSquare },
      { href: '/portal/admin/invoices', label: 'Money', icon: Receipt },
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    defaultOpen: false,
    items: [
      { href: '/portal/admin/reports', label: 'Reports', icon: BarChart3 },
      { href: '/portal/admin/reviews', label: 'Reviews', icon: Star },
      { href: '/portal/admin/campaigns', label: 'Campaigns', icon: Megaphone },
      { href: '/portal/admin/promotions', label: 'Promotions', icon: Percent },
    ],
  },
  {
    id: 'setup',
    label: 'Setup',
    defaultOpen: false,
    items: [
      { href: '/portal/admin/catalog', label: 'Catalog', icon: Tag },
      { href: '/portal/admin/templates', label: 'Templates', icon: FileText },
      { href: '/portal/admin/inventory', label: 'Inventory', icon: Package },
      { href: '/portal/admin/team', label: 'Team', icon: Users },
      { href: '/portal/admin/shop', label: 'Shop settings', icon: Store },
    ],
  },
] as const;

// Flat list for mobile bottom-tab + back-compat with anything that imports it.
const adminNav: readonly NavItem[] = ADMIN_NAV[0].items;
const adminMoreNav: readonly NavItem[] = ADMIN_NAV.slice(1).flatMap((g) => g.items);


// Path prefixes that don't require a session (set-password lives under /portal
// because it needs to share the portal layout shell visually, but the user
// isn't logged in until they submit).
const PUBLIC_PORTAL_PATHS = ['/portal/set-password', '/portal/approve', '/portal/warranty', '/portal/quote-accept'];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isPublic = PUBLIC_PORTAL_PATHS.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.get<{ user: SessionUser | null }>('/api/auth/me');
      if (cancelled) return;
      setUser(res.data?.user ?? null);
      setLoading(false);
      if (!res.data?.user && !isPublic) {
        router.replace('/login');
      }
    })();
    return () => { cancelled = true; };
  }, [isPublic, router]);

  const signOut = async () => {
    await api.post('/api/auth/logout');
    setAuthToken(null);
    setUser(null);
    router.replace('/login');
  };

  // Mobile bottom-tab uses the daily-spine items (admin) or the full
  // customer nav. Capped at 4 + a More overflow.
  const nav = user?.role === 'admin' ? adminNav : customerNav;
  void adminMoreNav; // referenced only by ADMIN_NAV; kept for back-compat

  // Gate admin pages — redirect a customer who guesses /portal/admin
  useEffect(() => {
    if (!loading && user && user.role !== 'admin' && pathname?.startsWith('/portal/admin')) {
      router.replace('/portal/dashboard');
    }
  }, [loading, user, pathname, router]);

  if (loading && !isPublic) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-rpm-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rpm-gray border-t-rpm-red" />
      </div>
    );
  }

  if (isPublic && !user) {
    // Render set-password (or other public portal routes) without the auth-gated chrome.
    return <div className="min-h-screen bg-rpm-black">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-rpm-black">
      <PWARegister />
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-rpm-charcoal border-r border-rpm-gray/50 fixed inset-y-0 left-0 z-40">
        <Link href="/" className="flex items-center gap-3 px-6 py-5 border-b border-rpm-gray/50">
          <div className="w-8 h-8 rounded-lg bg-rpm-red flex items-center justify-center font-bold text-white text-sm">R</div>
          <span className="text-rpm-white font-bold text-lg tracking-wide">RPM Auto Lab</span>
        </Link>

        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {user?.role === 'admin'
            ? ADMIN_NAV.map((group) => (
                <NavGroupBlock key={group.id} group={group} pathname={pathname} />
              ))
            : customerNav.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-rpm-red/10 text-rpm-red border border-rpm-red/20'
                        : 'text-rpm-silver hover:text-rpm-white hover:bg-rpm-gray/50'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                );
              })}
        </nav>

        <div className="px-4 py-4 border-t border-rpm-gray/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-rpm-gray flex items-center justify-center text-rpm-white font-semibold text-sm">
              {user ? initialsOf(user.name) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-rpm-white truncate">{user?.name ?? '—'}</p>
              <p className="text-xs text-rpm-silver truncate">{user?.email ?? ''}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rpm-silver hover:text-rpm-red transition-colors rounded-lg hover:bg-rpm-gray/30 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-rpm-charcoal border-b border-rpm-gray/50 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rpm-red flex items-center justify-center font-bold text-white text-xs">R</div>
          <span className="text-rpm-white font-bold tracking-wide">RPM Auto Lab</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-rpm-silver hover:text-rpm-white p-2 cursor-pointer"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Slide-out */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-rpm-charcoal border-r border-rpm-gray/50 flex flex-col"
            >
              <div className="px-6 py-5 border-b border-rpm-gray/50 flex items-center justify-between">
                <span className="text-rpm-white font-bold text-lg tracking-wide">Portal</span>
                <button onClick={() => setMobileOpen(false)} className="text-rpm-silver hover:text-rpm-white cursor-pointer">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
                {user?.role === 'admin'
                  ? ADMIN_NAV.map((group) => (
                      <NavGroupBlock
                        key={group.id}
                        group={group}
                        pathname={pathname}
                        onPick={() => setMobileOpen(false)}
                      />
                    ))
                  : customerNav.map((item) => {
                      const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                            isActive
                              ? 'bg-rpm-red/10 text-rpm-red border border-rpm-red/20'
                              : 'text-rpm-silver hover:text-rpm-white hover:bg-rpm-gray/50'
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          {item.label}
                        </Link>
                      );
                    })}
              </nav>
              <div className="px-4 py-4 border-t border-rpm-gray/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-rpm-gray flex items-center justify-center text-rpm-white font-semibold text-sm">
                    {user ? initialsOf(user.name) : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-rpm-white truncate">{user?.name ?? '—'}</p>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-rpm-silver hover:text-rpm-red transition-colors rounded-lg hover:bg-rpm-gray/30 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-rpm-charcoal border-t border-rpm-gray/50 px-2 py-1">
        <nav className="flex items-center justify-around">
          {nav.slice(0, 4).map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors',
                  isActive ? 'text-rpm-red' : 'text-rpm-silver'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label.replace('My ', '')}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium text-rpm-silver cursor-pointer"
          >
            <Settings className="w-5 h-5" />
            <span>More</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-14 pb-20 lg:pt-0 lg:pb-0 min-h-screen">
        {user?.role === 'admin' && (
          <div className="hidden lg:flex items-center gap-3 px-6 py-3 border-b border-rpm-gray/40 bg-rpm-charcoal/40 sticky top-0 z-30 backdrop-blur">
            <GlobalSearch />
            <Link
              href="/portal/admin/new-quote"
              className="ml-auto px-3 py-2 rounded-lg bg-rpm-red text-white text-sm font-bold hover:bg-rpm-red-dark whitespace-nowrap"
            >
              + New customer / job
            </Link>
          </div>
        )}
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

function NavGroupBlock({
  group, pathname, onPick,
}: {
  group: NavGroup;
  pathname: string | null;
  onPick?: () => void;
}) {
  const containsActive = group.items.some((i) => pathname === i.href || pathname?.startsWith(i.href + '/'));
  const [open, setOpen] = useState(group.defaultOpen || containsActive);
  // Auto-open if user navigates into a child after initial mount.
  useEffect(() => { if (containsActive) setOpen(true); }, [containsActive]);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-1.5 text-[10px] uppercase tracking-wider text-rpm-silver/70 font-bold hover:text-rpm-white"
      >
        <span>{group.label}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-0.5 space-y-1">
          {group.items.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onPick}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-rpm-red/10 text-rpm-red border border-rpm-red/20'
                    : 'text-rpm-silver hover:text-rpm-white hover:bg-rpm-gray/50'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
