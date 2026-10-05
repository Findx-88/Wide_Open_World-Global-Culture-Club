'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';

const DESKTOP = [
  { href: '/expeditions', label: 'Expeditions' },
  { href: '/members', label: 'Explorers' },
  { href: '/library', label: 'Library' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/recommend', label: 'Recommend' },
  { href: '/tools', label: 'Tools' },
];

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

const TABS = [
  { href: '/', label: 'Home', exact: true, icon: icon(<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>) },
  { href: '/expeditions', label: 'Expeditions', icon: icon(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>) },
  { href: '/calendar', label: 'Calendar', icon: icon(<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>) },
  { href: '/members', label: 'Passports', icon: icon(<><rect x="5" y="3" width="14" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M9 16h6" /></>) },
];

const MORE = [
  { href: '/join', label: 'Join the next meeting', hint: 'Link, countdown & time zones' },
  { href: '/library', label: 'The Library', hint: 'Books from every country' },
  { href: '/recommend', label: 'Recommend', hint: 'Suggest a book or film' },
  { href: '/tools', label: 'Tools', hint: 'Reading assistant & calendar feed' },
];

export function Nav({ member }: { member: { name: string } | null }) {
  const path = usePathname();
  const [more, setMore] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setMore(false), [path]);
  useEffect(() => {
    document.body.style.overflow = more ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [more]);

  const active = (href: string, exact?: boolean) => (exact ? path === href : path === href || path.startsWith(`${href}/`));
  const moreActive = MORE.some((m) => active(m.href));

  return (
    <>
      {/* Top bar: full navigation on desktop, slim brand bar on phones & tablets */}
      <header className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300 ${scrolled ? 'border-b border-line bg-bg/90 backdrop-blur-md' : 'border-b border-transparent'}`}>
        <nav className="container-page flex h-16 items-center justify-between gap-6 lg:h-[4.5rem]">
          <Link href="/" className="flex items-center" aria-label="Wide Open World — home">
            <img src="/wow-expeditions-logo.png" alt="" className="h-9 w-auto lg:h-10" />
          </Link>
          <ul className="hidden items-center gap-7 lg:flex">
            {DESKTOP.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={`text-[0.8rem] font-medium uppercase tracking-[0.16em] transition hover:text-accent ${active(l.href) ? 'text-accent' : 'text-ink-soft'}`}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link href={member ? '/me' : '/login'} className="btn btn-ghost !px-4 !py-2.5 !text-[0.72rem]">
              {member ? member.name.split(' ')[0] : 'Log in'}
            </Link>
            <Link href="/join" className="btn btn-primary hidden !px-5 !py-2.5 !text-[0.72rem] sm:inline-flex">
              Join the next meeting
            </Link>
          </div>
        </nav>
      </header>

      {/* Bottom tab bar: thumb-reachable navigation below the desktop breakpoint */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/95 backdrop-blur-md lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {TABS.map((t) => {
            const on = active(t.href, t.exact);
            return (
              <li key={t.href}>
                <Link href={t.href} aria-current={on ? 'page' : undefined} className={`flex min-h-[3.75rem] flex-col items-center justify-center gap-1 text-[0.66rem] font-semibold uppercase tracking-[0.08em] transition ${on ? 'text-accent' : 'text-ink-faint active:text-ink'}`}>
                  {t.icon}
                  {t.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button onClick={() => setMore((m) => !m)} aria-expanded={more} aria-haspopup="dialog" className={`flex min-h-[3.75rem] w-full flex-col items-center justify-center gap-1 text-[0.66rem] font-semibold uppercase tracking-[0.08em] transition ${more || moreActive ? 'text-accent' : 'text-ink-faint'}`}>
              {icon(<><circle cx="5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="19" cy="12" r="1.3" /></>)}
              More
            </button>
          </li>
        </ul>
      </nav>

      {more && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="More">
          <button className="absolute inset-0 bg-black/60" aria-label="Close menu" onClick={() => setMore(false)} />
          <div className="rise absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line-strong bg-raised p-5" style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />
            <ul className="grid gap-1">
              {MORE.map((m) => (
                <li key={m.href}>
                  <Link href={m.href} className="flex items-center justify-between rounded-xl px-3 py-4 active:bg-line">
                    <span>
                      <span className="block font-display text-2xl leading-tight">{m.label}</span>
                      <span className="block text-sm text-ink-faint">{m.hint}</span>
                    </span>
                    <span className="text-ink-faint">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
