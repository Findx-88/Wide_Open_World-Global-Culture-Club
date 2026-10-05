/** Plain-language labels for participation states, shared by member and admin screens. */
export const STATUS_LABEL = {
  unconfirmed: 'Unconfirmed',
  awaiting: 'Reminder pending',
  confirmed: 'Confirmed',
  declined: 'Not completed',
  verified: 'Attended / verified',
  expired: 'Confirmation expired',
} as const;

export type ParticipationStatus = keyof typeof STATUS_LABEL;

export const STATUS_TONE: Record<ParticipationStatus, string> = {
  unconfirmed: 'text-ink-faint',
  awaiting: 'text-gold',
  confirmed: 'text-ok',
  declined: 'text-ink-soft',
  verified: 'text-ok',
  expired: 'text-danger',
};

export const VISA_LABEL = { book: 'Book Visa', movie: 'Movie Visa', class: 'Class Visa', legacy: 'Legacy visa' } as const;
