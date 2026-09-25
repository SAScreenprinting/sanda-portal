import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';

// Shared sign-in checks for API routes. Routes use the service key to read and write data, so
// each one has to decide for itself who is asking; never trust ids sent by the browser.
export function serviceDb() {
  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };
  const { data: profile } = await serviceDb().from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  return { user, isAdmin: !!profile?.is_admin };
}

export const unauthorized = () => Response.json({ error: 'Not signed in' }, { status: 401 });
export const forbidden = () => Response.json({ error: 'Forbidden' }, { status: 403 });
