import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';

// A client finished a design in the studio. It is saved to their POD profile as a Design
// (not an order) so S&A can set it up with their profile and connected stores.
export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const d = await request.json();
  if (!d.productTitle || !d.designId) return Response.json({ error: 'Missing design details' }, { status: 400 });

  const db = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Random 6-digit design number, re-rolled if it is already taken
  let number = '';
  for (let i = 0; i < 8; i++) {
    const candidate = String(Math.floor(100000 + Math.random() * 900000));
    const { data: clash } = await db.from('saved_designs').select('id').eq('name', `Design #${candidate}`).limit(1);
    if (!clash || clash.length === 0) { number = candidate; break; }
  }
  if (!number) return Response.json({ error: 'Could not create a design number. Please try again.' }, { status: 500 });

  const { data: row, error } = await db.from('saved_designs').insert({
    client_id: user.id,
    name: `Design #${number}`,
    thumbnail: Object.values(d.previewImageUrls || {})[0] || null,
    product: {
      designNumber: number,
      status: 'Submitted',
      productId: d.productId,
      productTitle: d.productTitle,
      productHandle: d.productHandle || null,
      variantId: d.variantId || null,
      variantTitle: d.variantTitle || null,
      studioDesignId: d.designId,
      hasScreenPrint: !!d.hasScreenPrint,
      colorCounts: d.colorCounts || [],
      feeItems: d.feeItems || [],
    },
    decorations: {
      previews: d.previewImageUrls || {},
      printFiles: d.printFileUrls || [],
      spec: d.spec || null,
    },
  }).select('id').single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Keep the print files in the client's Artwork Library too
  const files = (d.printFileUrls || []).map((f) => ({
    client_id: user.id,
    name: `Design #${number} - ${f.viewName} ${f.printAreaLabel}`.slice(0, 120),
    file_url: f.url,
    thumbnail: (d.previewImageUrls || {})[f.viewName] || null,
    file_type: 'PNG',
    tags: ['design-studio'],
  }));
  if (files.length) await db.from('artwork').insert(files);

  return Response.json({ ok: true, id: row.id, designNumber: number });
}
