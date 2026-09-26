import { getAuth, unauthorized } from '@/lib/apiAuth';
import { makeLinkCode } from '@/lib/podLink';

export const dynamic = 'force-dynamic';

// The signed-in client's code for connecting their Shopify store in the S&A Studios app
export async function GET() {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  if (!process.env.PORTAL_API_KEY) return Response.json({ error: 'Not configured' }, { status: 503 });
  return Response.json({ code: makeLinkCode(auth.user.id) });
}
