'use client';

import { ActionForm, Check, Field, Select, Submit } from '@/components/admin/forms';
import { saveSettings } from '@/server/admin/actions';
import { COMMON_TIMEZONES } from '@/lib/time';
import { isOn, type SiteSettings } from '@/lib/settings';

const H = ({ children }: { children: React.ReactNode }) => <h3 className="mt-2 border-t border-line pt-6 font-display text-xl first:mt-0 first:border-0 first:pt-0">{children}</h3>;

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  return (
    <ActionForm action={saveSettings} className="grid gap-5">
      <H>Club links</H>
      <Field label="Default meeting link (Zoom)" name="default_meet_url" defaultValue={settings.default_meet_url} hint="Used by every session that has no link of its own." />
      <Field label="WhatsApp community link" name="whatsapp_url" defaultValue={settings.whatsapp_url} />
      <Select label="Default time zone for new sessions" name="default_timezone" defaultValue={settings.default_timezone} options={COMMON_TIMEZONES.map((z) => [z, z] as [string, string])} />
      <Field label="Reading assistant (Tools page) link" name="reading_assistant_url" defaultValue={settings.reading_assistant_url} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Instagram link" name="instagram_url" defaultValue={settings.instagram_url} />
        <Field label="Contact email" name="contact_email" type="email" defaultValue={settings.contact_email} />
      </div>

      <H>Email</H>
      <Check label="Send emails (master switch — nothing is sent while this is off)" name="email_enabled" defaultChecked={isOn(settings.email_enabled)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Send from" name="email_from" defaultValue={settings.email_from} placeholder="Wide Open World <hello@yourdomain.com>" hint="Must be an address on a domain verified with your email provider." />
        <Field label="Website address (used in email links)" name="site_url" defaultValue={settings.site_url} placeholder="https://yourdomain.com" />
        <Field label="Meeting reminders (hours before, comma-separated)" name="meeting_reminder_hours" defaultValue={settings.meeting_reminder_hours} hint="24 = one email the day before. Use 24,1 for two." />
        <Field label="“Expedition begins” reminder (days before)" name="expedition_reminder_days" type="number" min={0} defaultValue={settings.expedition_reminder_days} hint="0 turns it off." />
      </div>

      <H>Visas &amp; confirmations</H>
      <Check label="Open confirmations automatically when an expedition’s last session ends" name="auto_confirmations" defaultChecked={isOn(settings.auto_confirmations)} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Reminder schedule (days after first email)" name="confirm_reminder_days" defaultValue={settings.confirm_reminder_days} hint="3,7,14 → 4 emails in total, then it stops. Max 3 reminders." />
        <Field label="Days to wait after the last reminder" name="confirm_expire_grace_days" type="number" min={1} defaultValue={settings.confirm_expire_grace_days} hint="Then the request expires and no visa is awarded." />
        <Field label="Minutes in a session to count as attended" name="attendance_min_minutes" type="number" min={1} defaultValue={settings.attendance_min_minutes} />
      </div>

      <div>
        <Submit>Save settings</Submit>
      </div>
    </ActionForm>
  );
}
