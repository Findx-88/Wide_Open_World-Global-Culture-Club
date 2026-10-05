import { Panel } from '@/components/admin/forms';
import { adminList } from '@/server/admin/data';
import { PasswordForm } from './PasswordForm';

export const metadata = { title: 'Account' };

export default async function AdminAccount() {
  const admins = await adminList();
  return (
    <div className="grid gap-6">
      <h1 className="font-display text-4xl">Account</h1>
      <Panel title="Change password">
        <PasswordForm />
      </Panel>
      <Panel title="Admins" description="New admins are added with: npm run admin:create -- email@example.com &quot;Name&quot;">
        <ul className="divide-y divide-line text-sm">
          {admins.map((a) => (
            <li key={a.id} className="flex justify-between py-2">
              <span>{a.name} · {a.email}</span>
              <span className="text-ink-faint">{a.lastLoginAt ? `last in ${new Date(a.lastLoginAt).toLocaleDateString('en-GB')}` : 'never signed in'}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
