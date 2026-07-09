import { Resend } from 'resend';

/**
 * Transactional email helper backed by Resend.
 *
 * In development (no `RESEND_API_KEY`) emails are logged to the console instead
 * of being sent, so signup / verification flows can be exercised locally
 * without a mail provider. Verification/reset links are printed to the terminal.
 */
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const from = process.env.EMAIL_FROM ?? 'no-reply@localhost';

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(email: OutgoingEmail): Promise<void> {
  if (!resend) {
    // Dev fallback: surface the (verification / reset) link in the console.
    console.log('\n[email:dev] (no RESEND_API_KEY) --------------------');
    console.log('to:      ', email.to);
    console.log('subject: ', email.subject);
    console.log(email.text);
    console.log('-----------------------------------------------\n');
    return;
  }
  const { error } = await resend.emails.send({
    from,
    to: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  if (error) {
    console.error('[email] Resend send failed:', error);
    throw new Error('Email could not be sent');
  }
}
