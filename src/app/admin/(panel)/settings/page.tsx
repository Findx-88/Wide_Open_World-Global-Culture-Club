import { Panel } from '@/components/admin/forms';
import { adminSite } from '@/server/admin/data';
import { SettingsForm } from './SettingsForm';

export const metadata = { title: 'Settings' };

export default async function AdminSettings() {
  const { settings } = await adminSite();
  return (
    <div className="grid gap-6">
      <h1 className="font-display text-4xl">Settings</h1>
      <Panel title="Club links & defaults" description="Used across the website — change them here, never in code.">
        <SettingsForm settings={settings} />
      </Panel>
    </div>
  );
}
