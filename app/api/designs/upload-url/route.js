import { getAuth, unauthorized, forbidden, serviceDb } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

const ALLOWED = /\.(png|jpe?g|webp)$/i;

// Admin only: a one-time link so the browser can upload a picture straight to storage (big print files do not fit through the server).
export async function POST(request) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  if (!auth.isAdmin) return forbidden();
  const { filename } = await request.json().catch(() => ({}));
  const name = String(filename || '');
  if (!ALLOWED.test(name)) return Response.json({ error: 'Upload a PNG, JPG or WebP picture.' }, { status: 400 });

  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
  const path = `custom/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safe}`;
  const db = serviceDb();
  const { data, error } = await db.storage.from('artwork').createSignedUploadUrl(path);
  if (error || !data?.token) return Response.json({ error: error?.message || 'Could not start the upload.' }, { status: 500 });
  const { data: { publicUrl } } = db.storage.from('artwork').getPublicUrl(path);
  return Response.json({ path, token: data.token, publicUrl });
}
