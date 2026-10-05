import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/server/auth';
import { logout } from '@/server/admin/actions';
import { AdminNav } from './AdminNav';

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · WOW Admin' }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="border-b border-line bg-raised lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 p-5 lg:block">
          <Link href="/admin" className="flex items-center gap-3">
            <img src="/wow-expeditions-logo.png" alt="" className="h-9 w-auto" />
            <span className="font-display text-xl">Admin</span>
          </Link>
          <Link href="/" target="_blank" className="text-xs text-ink-faint hover:text-accent lg:mt-2 lg:block">View site ↗</Link>
        </div>
        <AdminNav />
        <div className="hidden p-5 text-xs text-ink-faint lg:absolute lg:bottom-0 lg:block">
          <div className="truncate">{admin.email}</div>
          <form action={logout}>
            <button className="mt-2 hover:text-accent">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 p-5 sm:p-8 lg:p-10">{children}</div>
    </div>
  );
}
