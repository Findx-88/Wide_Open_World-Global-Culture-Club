/**
 * Every kind of email WOW can send. To add a new notification type:
 *   1. add an entry here (key, label, description)
 *   2. add a renderer with the same key in ./templates.ts
 *   3. call `enqueue()` (./queue.ts) from wherever it should trigger
 * Members see each type automatically on their preferences page and can switch it off.
 */
export const NOTIFICATION_TYPES = [
  { key: 'meeting_reminder', label: 'Meeting reminders', description: 'A short reminder before each live session, with the join link and a calendar button.' },
  { key: 'expedition_reminder', label: 'Upcoming expeditions', description: 'A heads-up a few days before a new expedition begins.' },
  { key: 'participation_request', label: 'Check-ins on what you read, watched & attended', description: 'After an expedition ends we ask what you did, and send a few gentle reminders if you haven’t answered. You can answer any time from the link.' },
  { key: 'visa_awarded', label: 'Visa confirmations', description: 'A note whenever a new visa is stamped in your Cultural Passport.' },
] as const;

export type NotificationKey = (typeof NOTIFICATION_TYPES)[number]['key'];
export const isNotificationKey = (k: string): k is NotificationKey => NOTIFICATION_TYPES.some((t) => t.key === k);
