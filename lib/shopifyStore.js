// Talks to a client's own Shopify store with the Admin API token they gave us.
const VERSION = '2025-01';

export function cleanDomain(input) {
  const d = String(input || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(d) ? d : null;
}

export async function shopifyGraphql(domain, token, query, variables) {
  const res = await fetch(`https://${domain}/admin/api/${VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 || res.status === 403) throw new Error('Shopify rejected that access token.');
  if (res.status === 404) throw new Error('That store address was not found.');
  if (!res.ok) throw new Error(`Shopify returned an error (${res.status}).`);
  const json = await res.json();
  if (json.errors) throw new Error(typeof json.errors === 'string' ? json.errors : JSON.stringify(json.errors).slice(0, 200));
  return json.data;
}

export async function checkStore(domain, token) {
  const data = await shopifyGraphql(domain, token, '{ shop { name myshopifyDomain } }');
  return data.shop;
}

export async function publishProduct(domain, token, { title, description, price, sku, images, draft }) {
  const created = await shopifyGraphql(domain, token, `mutation($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
    productCreate(product: $product, media: $media) {
      product { id handle onlineStoreUrl variants(first: 1) { nodes { id } } }
      userErrors { field message }
    }
  }`, {
    product: { title, descriptionHtml: description || '', status: draft ? 'DRAFT' : 'ACTIVE' },
    media: (images || []).map((u) => ({ originalSource: u, mediaContentType: 'IMAGE' })),
  });
  const pc = created.productCreate;
  if (pc.userErrors?.length) throw new Error(pc.userErrors.map((e) => e.message).join('; '));
  const product = pc.product;
  const variantId = product.variants.nodes[0]?.id;
  if (variantId) {
    const upd = await shopifyGraphql(domain, token, `mutation($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) { userErrors { field message } }
    }`, { productId: product.id, variants: [{ id: variantId, price: String(price), inventoryItem: { sku } }] });
    const errs = upd.productVariantsBulkUpdate.userErrors;
    if (errs?.length) throw new Error(errs.map((e) => e.message).join('; '));
  }
  return { id: product.id, handle: product.handle, adminUrl: `https://${domain}/admin/products/${String(product.id).split('/').pop()}` };
}

// ---- Publish one design as a single product with many variants (colors x sizes) -------------------------------
export const PRODUCT_SET_MUTATION = `mutation($input: ProductSetInput!) {
  productSet(input: $input, synchronous: true) {
    product { id handle variants(first: 5) { nodes { id sku } } }
    userErrors { field message code }
  }
}`;

/** The productSet input for a design's variants. `variants` = [{ values: [...aligned to optionNames], price, sku }]. */
export function buildProductSetInput({ title, description, draft, images, mediaFiles, optionNames, variants }) {
  return {
    title,
    descriptionHtml: description || '',
    status: draft ? 'DRAFT' : 'ACTIVE',
    productOptions: optionNames.map((name, i) => ({
      name,
      position: i + 1,
      values: [...new Set(variants.map((v) => v.values[i]))].map((v) => ({ name: v })),
    })),
    variants: variants.map((v) => ({
      optionValues: optionNames.map((name, i) => ({ optionName: name, name: v.values[i] })),
      price: String(v.price),
      sku: v.sku,
      inventoryItem: { tracked: false },
      // The picture a shopper sees when they pick this variant (its color's mockup)
      ...(v.fileSource ? { file: { originalSource: v.fileSource, contentType: 'IMAGE', alt: v.fileAlt || undefined } } : {}),
    })),
    files: mediaFiles
      ? mediaFiles.map((f) => ({ originalSource: f.source, contentType: 'IMAGE', alt: f.alt || undefined }))
      : (images || []).map((u) => ({ originalSource: u, contentType: 'IMAGE' })),
  };
}

export async function publishProductVariants(domain, token, args) {
  const data = await shopifyGraphql(domain, token, PRODUCT_SET_MUTATION, { input: buildProductSetInput(args) });
  const r = data.productSet;
  if (r.userErrors?.length) throw new Error(r.userErrors.map((e) => e.message).join('; '));
  return { id: r.product.id, handle: r.product.handle, adminUrl: `https://${domain}/admin/products/${String(r.product.id).split('/').pop()}` };
}

// ---- Upload generated images straight into the store's own file storage ----------------------------------------
export const STAGED_UPLOAD_MUTATION = `mutation($input: [StagedUploadInput!]!) {
  stagedUploadsCreate(input: $input) {
    stagedTargets { url resourceUrl parameters { name value } }
    userErrors { field message }
  }
}`;

/** Uploads [{ filename, buffer, mimeType }] to the store and returns a Shopify-hosted source URL for each, in order. */
export async function stageImages(domain, token, files) {
  const urls = [];
  for (let start = 0; start < files.length; start += 20) {
    const chunk = files.slice(start, start + 20);
    const data = await shopifyGraphql(domain, token, STAGED_UPLOAD_MUTATION, {
      input: chunk.map((f) => ({ filename: f.filename, mimeType: f.mimeType, resource: 'IMAGE', httpMethod: 'POST', fileSize: String(f.buffer.length) })),
    });
    const r = data.stagedUploadsCreate;
    if (r.userErrors?.length) throw new Error(r.userErrors.map((e) => e.message).join('; '));
    await Promise.all(chunk.map(async (f, i) => {
      const t = r.stagedTargets[i];
      const form = new FormData();
      t.parameters.forEach((p) => form.append(p.name, p.value));
      form.append('file', new Blob([f.buffer], { type: f.mimeType }), f.filename);
      const res = await fetch(t.url, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Could not upload an image to your store (${res.status}).`);
    }));
    urls.push(...r.stagedTargets.map((t) => t.resourceUrl));
  }
  return urls;
}
