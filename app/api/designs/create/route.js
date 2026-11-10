import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';
import { getAuth } from '@/lib/apiAuth';
import { makeSku } from '@/lib/designSku';
import { sendDesignReviewEmail } from '@/lib/designEmail';
import { newDesignNumber } from '@/lib/designNumber';

// A client finished a design in the studio. It is saved to their POD profile as a Design
// (not an order) so S&A can set it up with their profile and connected stores.
export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Not signed in' }, { status: 401 });

  const d = await request.json();
  if (!d.productTitle || !d.designId) return Response.json({ error: 'Missing design details' }, { status: 400 });

  const db = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // S&A (admin) can design for a client. Their own and clients' designs made by S&A skip review:
  // saved as Approved with the SKU, so the client can publish it to their store right away.
  const { isAdmin } = await getAuth();
  const forClientId = d.forClientId ? String(d.forClientId) : null;
  if (forClientId && !isAdmin) return Response.json({ error: 'Only S&A can create a design for a client.' }, { status: 403 });
  let ownerId = user.id;
  let owner = null;
  if (forClientId) {
    const { data: target } = await db.from('profiles').select('id, email, business_name').eq('id', forClientId).maybeSingle();
    if (!target) return Response.json({ error: 'That client was not found.' }, { status: 404 });
    ownerId = target.id;
    owner = target;
  }

  const number = await newDesignNumber(db);
  if (!number) return Response.json({ error: 'Could not create a design number. Please try again.' }, { status: 500 });

  const product = {
    designNumber: number,
    status: isAdmin ? 'Approved' : 'Submitted',
    productId: d.productId,
    productTitle: d.productTitle,
    productHandle: d.productHandle || null,
    variantId: d.variantId || null,
    variantTitle: d.variantTitle || null,
    studioDesignId: d.designId,
    hasScreenPrint: !!d.hasScreenPrint,
    colorCounts: d.colorCounts || [],
    feeItems: d.feeItems || [],
  };
  if (isAdmin) {
    product.sku = makeSku(product);
    product.reviewedAt = new Date().toISOString();
    product.createdBy = 'S&A';
  }

  const { data: row, error } = await db.from('saved_designs').insert({
    client_id: ownerId,
    name: `Design #${number}`,
    thumbnail: Object.values(d.previewImageUrls || {})[0] || null,
    product,
    decorations: {
      previews: d.previewImageUrls || {},
      printFiles: d.printFileUrls || [],
      spec: d.spec || null,
    },
  }).select('id').single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Keep the print files in the client's Artwork Library too
  const files = (d.printFileUrls || []).map((f) => ({
    client_id: ownerId,
    name: `Design #${number} - ${f.viewName} ${f.printAreaLabel}`.slice(0, 120),
    file_url: f.url,
    thumbnail: (d.previewImageUrls || {})[f.viewName] || null,
    file_type: 'PNG',
    tags: ['design-studio'],
  }));
  if (files.length) await db.from('artwork').insert(files);

  // Tell the client when S&A made a design for them
  let emailed = false;
  if (forClientId && owner?.email) {
    emailed = await sendDesignReviewEmail({ to: owner.email, status: 'Assigned', design: { id: row.id, name: `Design #${number}`, product }, origin: new URL(request.url).origin });
  }

  return Response.json({ ok: true, id: row.id, designNumber: number, approved: isAdmin, sku: product.sku || null, forClient: owner ? (owner.business_name || owner.email) : null, emailed });
}
