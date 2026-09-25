import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { recoveryEmailHtml } from '@/lib/recoveryEmail';

// Password reset email sent by S&A itself (through Resend), not by Supabase.
// Supabase only produces the one-time token; the link points at this portal.
// Shows as "S&A POD" in the inbox; the address itself still comes from EMAIL_FROM.
function senderAddress(emailFrom) {
  const match = /<([^>]+)>/.exec(emailFrom || '');
  const address = match ? match[1] : (emailFrom || '').trim();
  return `S&A POD <${address}>`;
}

export async function POST(request) {
  const { email } = await request.json().catch(() => ({}));
  const ok = NextResponse.json({ ok: true }); // same answer whether or not the account exists
  if (!email || typeof email !== 'string') return ok;
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return NextResponse.json({ error: 'Email is not configured' }, { status: 503 });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email: email.trim().toLowerCase() });
  const token = data?.properties?.hashed_token;
  if (error || !token) return ok;

  const origin = new URL(request.url).origin;
  const link = `${origin}/auth/confirm?token_hash=${encodeURIComponent(token)}&type=recovery&next=${encodeURIComponent('/settings?reset=true')}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: senderAddress(process.env.EMAIL_FROM),
      to: [email.trim()],
      reply_to: 'sascreenprinting@outlook.com',
      subject: 'Reset your S&A portal password',
      html: recoveryEmailHtml(link),
    }),
  });
  if (!res.ok) return NextResponse.json({ error: 'Could not send the email right now.' }, { status: 502 });
  return ok;
}
