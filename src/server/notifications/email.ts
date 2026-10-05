import 'server-only';

/**
 * Email transport. Uses Resend (https://resend.com) when RESEND_API_KEY is set.
 * To switch provider later, only this file changes.
 */
export const emailProviderConfigured = () => !!process.env.RESEND_API_KEY;

export type SendResult = { ok: true } | { ok: false; error: string; retryable: boolean };

export async function sendEmail(o: { from: string; to: string; subject: string; html: string; text: string }): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: 'No email provider configured (RESEND_API_KEY missing).', retryable: true };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: o.from, to: [o.to], subject: o.subject, html: o.html, text: o.text }),
    });
    if (res.ok) return { ok: true };
    const body = await res.text().catch(() => '');
    return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 300)}`, retryable: res.status === 429 || res.status >= 500 };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), retryable: true };
  }
}
