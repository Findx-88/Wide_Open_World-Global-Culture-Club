'use client';

export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try {
      localStorage.setItem('wow-theme', next);
    } catch {}
  };
  return (
    <button onClick={toggle} aria-label="Switch light/dark theme" className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink-soft transition hover:border-accent hover:text-accent">
      {/* Sun shows in dark mode, moon in light mode — pure CSS, no hydration mismatch */}
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] [[data-theme=light]_&]:hidden" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="4.5" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg viewBox="0 0 24 24" className="hidden h-[18px] w-[18px] [[data-theme=light]_&]:block" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  );
}
