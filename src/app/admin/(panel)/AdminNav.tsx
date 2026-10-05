'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  ['/admin', 'Dashboard'],
  ['/admin/expeditions', 'Expeditions'],
  ['/admin/members', 'Members'],
  ['/admin/calendar', 'Calendar'],
  ['/admin/notifications', 'Emails'],
  ['/admin/recommendations', 'Recommendations'],
  ['/admin/settings', 'Settings'],
  ['/admin/account', 'Account'],
] as const;

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3">
      {ITEMS.map(([href, label]) => {
        const active = href === '/admin' ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} className={`shrink-0 rounded-lg px-3 py-2 text-sm transition ${active ? 'bg-gold/15 text-gold' : 'text-ink-soft hover:bg-line hover:text-ink'}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
