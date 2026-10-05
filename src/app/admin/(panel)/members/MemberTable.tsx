'use client';

import Link from 'next/link';
import { useDeferredValue, useState } from 'react';
import { flagUrl } from '@/lib/format';

type Row = { id: number; name: string; passportNumber: string; countryIso2: string; countryName: string; status: string; email: string | null; isPublic: boolean; visas: string[]; visaCount: number };

export function MemberTable({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const query = useDeferredValue(q.trim().toLowerCase());
  const list = rows.filter((r) => (showInactive || r.status === 'active') && (!query || `${r.name} ${r.passportNumber} ${r.countryName} ${r.email ?? ''}`.toLowerCase().includes(query)));
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, passport, country, email…" className="field max-w-sm" />
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="accent-[var(--gold)]" /> Show inactive
        </label>
        <span className="ml-auto text-sm text-ink-faint">{list.length} shown</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-ink-faint">
            <tr className="border-b border-line">
              <th className="py-2 pr-3 font-semibold">Passport</th>
              <th className="py-2 pr-3 font-semibold">Name</th>
              <th className="py-2 pr-3 font-semibold">Country</th>
              <th className="py-2 pr-3 font-semibold">Visas</th>
              <th className="py-2 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className={`border-b border-line ${r.status !== 'active' ? 'opacity-50' : ''}`}>
                <td className="py-3 pr-3 font-mono text-xs">{r.passportNumber}</td>
                <td className="py-3 pr-3">
                  {r.name}
                  {!r.isPublic && <span className="ml-2 text-xs text-ink-faint">(private)</span>}
                  {r.email && <div className="text-xs text-ink-faint">{r.email}</div>}
                </td>
                <td className="py-3 pr-3">
                  <span className="flex items-center gap-2"><img src={flagUrl(r.countryIso2, 40)} alt="" className="h-3 w-4 object-cover" /> {r.countryName}</span>
                </td>
                <td className="py-3 pr-3 text-ink-soft">{r.visaCount ? `${r.visaCount} · ${r.visas.join(', ')}` : '—'}</td>
                <td className="py-3 text-right">
                  <Link href={`/admin/members/${r.id}`} className="text-accent link-underline">Manage</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
