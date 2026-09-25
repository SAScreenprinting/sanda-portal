import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Finishes an emailed sign-in link. Done as a POST from a button click so mail scanners
// that pre-open links can't use up the one-time token.
export async function POST(request) {
  const { token_hash, type } = await request.json().catch(() => ({}));
  if (!token_hash || !['recovery', 'invite', 'magiclink', 'email'].includes(type)) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) return NextResponse.json({ error: 'This link has expired or was already used.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
