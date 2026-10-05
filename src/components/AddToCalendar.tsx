'use client';

import { useEffect, useRef, useState } from 'react';
import { googleCalendarUrl, outlookCalendarUrl, subscribeUrls, webcalUrl, type CalEvent } from '@/lib/calendar';

const Row = ({ href, title, hint, icon, ...rest }: { href: string; title: string; hint: string; icon: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a
    href={href}
    role="menuitem"
    className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-line active:bg-line"
    {...rest}
  >
    <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sunken text-lg">{icon}</span>
    <span className="min-w-0">
      <span className="block text-[0.95rem] font-medium text-ink">{title}</span>
      <span className="block truncate text-xs text-ink-faint">{hint}</span>
    </span>
  </a>
);

type Links = { google: string; apple: string; outlook: string; office: string };

/** Button + menu offering Google, Apple and Outlook. Nothing is ever downloaded: web calendars open
 *  pre-filled in a new tab, and Apple uses a webcal:// link that the Calendar app opens directly. */
function CalendarMenu({
  links,
  label,
  className,
  align,
  heading,
  hints,
}: {
  links: (origin: string) => Links;
  label: string;
  className: string;
  align: 'left' | 'right';
  heading: string;
  hints: { google: string; apple: string; outlook: string };
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e.type === 'keydown' && (e as KeyboardEvent).key !== 'Escape') return;
      if (e.type === 'pointerdown' && box.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const l = open && origin ? links(origin) : null;

  return (
    <div ref={box} className="relative inline-block">
      <button type="button" className={className} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
        {label}
      </button>
      {l && (
        <div
          role="menu"
          className={`absolute z-40 mt-2 w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl border border-line-strong bg-raised p-2 text-left normal-case tracking-normal shadow-2xl ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          <div className="px-3 pb-1 pt-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ink-faint">{heading}</div>
          <Row href={l.google} target="_blank" rel="noreferrer" icon="G" title="Google Calendar" hint={hints.google} onClick={() => setOpen(false)} />
          <Row href={l.apple} icon="📅" title="Apple Calendar" hint={hints.apple} onClick={() => setOpen(false)} />
          <Row href={l.outlook} target="_blank" rel="noreferrer" icon="O" title="Outlook" hint={hints.outlook} onClick={() => setOpen(false)} />
          <div className="mt-1 border-t border-line px-3 py-2 text-xs text-ink-faint">
            Work or school account?{' '}
            <a className="text-accent link-underline" target="_blank" rel="noreferrer" href={l.office}>Use Microsoft 365</a>
          </div>
        </div>
      )}
    </div>
  );
}

/** Add one session to the visitor's calendar. */
export function AddToCalendar({
  event,
  label = 'Add to calendar',
  className = 'btn btn-ghost',
  align = 'left',
}: {
  event: CalEvent;
  label?: string;
  className?: string;
  align?: 'left' | 'right';
}) {
  return (
    <CalendarMenu
      label={label}
      className={className}
      align={align}
      heading="Choose your calendar"
      hints={{ google: 'Opens Google Calendar, pre-filled', apple: 'Opens the Calendar app — iPhone, iPad & Mac', outlook: 'Opens Outlook on the web, pre-filled' }}
      links={(origin) => {
        const ev: CalEvent = { ...event, pageUrl: event.pageUrl ?? `${origin}/join` };
        return {
          google: googleCalendarUrl(ev),
          apple: webcalUrl(`${origin}/events/${event.id}/event.ics`),
          outlook: outlookCalendarUrl(ev, 'live'),
          office: outlookCalendarUrl(ev, 'office'),
        };
      }}
    />
  );
}

/** Subscribe to the club's live feed: every new session appears automatically. */
export function SubscribeToCalendar({
  label = 'Subscribe to all',
  className = 'btn btn-primary',
  align = 'left',
}: {
  label?: string;
  className?: string;
  align?: 'left' | 'right';
}) {
  return (
    <CalendarMenu
      label={label}
      className={className}
      align={align}
      heading="Subscribe in your calendar"
      hints={{ google: 'Adds the WOW calendar to Google', apple: 'Subscribes in the Calendar app', outlook: 'Adds the WOW calendar to Outlook' }}
      links={(origin) => subscribeUrls(`${origin}/calendar.ics`)}
    />
  );
}
