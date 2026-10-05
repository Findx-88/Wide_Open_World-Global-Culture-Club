/**
 * Every admin-editable setting, with its default. Add a key here and it is available everywhere
 * via `setting(settings, key)`; the admin Settings screen lists these for editing.
 */
export const SETTING_DEFAULTS = {
  // Club links
  whatsapp_url: '',
  default_meet_url: '',
  default_timezone: 'Asia/Kolkata',
  reading_assistant_url: '',
  instagram_url: '',
  contact_email: '',
  site_url: '', // public https://… address, used in emails
  // Email
  email_enabled: 'false', // master switch — nothing is sent until this is 'true'
  email_from: '', // e.g. "Wide Open World <hello@yourdomain.com>"
  meeting_reminder_hours: '24', // comma list, hours before a session (e.g. "24,1")
  expedition_reminder_days: '7', // days before an expedition starts
  // Confirmations & visas
  auto_confirmations: 'true', // open confirmations automatically when an expedition's last session ends
  confirm_reminder_days: '3,7,14', // reminder emails, days after the first request (max 4 emails in total)
  confirm_expire_grace_days: '7', // days after the last reminder before the request expires
  attendance_min_minutes: '30', // minutes in a session to count as attended
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type SiteSettings = Record<SettingKey, string> & { current_expedition_id?: string };

export function withDefaults(raw: Record<string, string>): SiteSettings {
  return { ...SETTING_DEFAULTS, ...raw } as SiteSettings;
}

export const numberList = (v: string) =>
  v
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0);

export const isOn = (v: string | undefined) => v === 'true' || v === 'on' || v === '1';
