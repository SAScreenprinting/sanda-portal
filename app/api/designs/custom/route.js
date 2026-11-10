import { getAuth, unauthorized, forbidden, serviceDb } from '@/lib/apiAuth';
import { sanitizeCustom } from '@/lib/customDesign';
import { buildVariantSkus } from '@/lib/designSku';
import { newDesignNumber } from '@/lib/designNumber';
import { sendDesignReviewEmail } from '@/lib/designEmail';

export const dynamic = 'force-dynamic';

// Admin only: make a POD product by hand (uploaded pictures, a typed blank name, chosen colors and sizes) for a client.
// It is saved approved with a design number, and every color/size gets its own SKU, so the client can add it to their store.
export async function POST(request) {
  const auth = await getAuth();
  if (!auth.user) return unauthorized();
  if (!auth.isAdmin) return forbidden();

  const d = await request.json().catch(() => ({}));
  const title = String(d.title || '').replace(/\s+/g, ' ').trim().slice(0, 150);
  if (!title) return Response.json({ error: 'Enter a product name.' }, { status: 400 });

  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/artwork/`;
  const checked = sanitizeCustom(d, { imagePrefix: base });
  if (checked.error) return Response.json({ error: checked.error }, { status: 400 });
  const custom = checked.custom;

  const okUrl = (u) => (u && String(u).startsWith(base) ? String(u) : null);
  const front = okUrl(d.artwork?.front);
  const back = okUrl(d.artwork?.back);
  if (!front) return Response.json({ error: 'Upload the artwork (the print file).' }, { status: 400 });

  const db = serviceDb();
  let ownerId = auth.user.id;
  let owner = null;
  if (d.forClientId) {
    const { data: target } = await db.from('profiles').select('id, email, business_name').eq('id', String(d.forClientId)).maybeSingle();
    if (!target) return Response.json({ error: 'That client was not found.' }, { status: 404 });
    ownerId = target.id;
    owner = target;
  }

  const number = await newDesignNumber(db);
  if (!number) return Response.json({ error: 'Could not create a design number. Please try again.' }, { status: 500 });

  const skus = buildVariantSkus(number, ['Color', 'Size'], custom.variants);
  const product = {
    designNumber: number,
    status: 'Approved',
    productId: null,
    productTitle: title,
    productHandle: null,
    variantId: null,
    variantTitle: null,
    sku: `POD-${number}`,
    custom,
    hasScreenPrint: false,
    colorCounts: [],
    feeItems: [],
    reviewedAt: new Date().toISOString(),
    createdBy: 'S&A',
  };
  const previews = { Front: front, ...(back ? { Back: back } : {}) };
  const printFiles = [
    { viewName: 'Front', printAreaLabel: 'Print file', url: front },
    ...(back ? [{ viewName: 'Back', printAreaLabel: 'Print file', url: back }] : []),
  ];

  const { data: row, error } = await db.from('saved_designs').insert({
    client_id: ownerId,
    name: `Design #${number}`,
    thumbnail: front,
    product,
    decorations: { previews, printFiles, spec: null, custom: true },
  }).select('id').single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Keep the print files in the client's Artwork Library too
  await db.from('artwork').insert(printFiles.map((f) => ({
    client_id: ownerId,
    name: `Design #${number} - ${f.viewName} ${f.printAreaLabel}`.slice(0, 120),
    file_url: f.url,
    thumbnail: f.url,
    file_type: 'PNG',
    tags: ['custom-design'],
  })));

  let emailed = false;
  if (d.forClientId && owner?.email) {
    emailed = await sendDesignReviewEmail({ to: owner.email, status: 'Assigned', design: { id: row.id, name: `Design #${number}`, product }, origin: new URL(request.url).origin });
  }

  return Response.json({
    ok: true, id: row.id, designNumber: number, sku: product.sku,
    forClient: owner ? (owner.business_name || owner.email) : null, emailed,
    variants: custom.variants.map((v, i) => ({ color: v[0], size: v[1], sku: skus[i] })),
  });
}
