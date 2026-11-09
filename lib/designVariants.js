// What colors, sizes (or other options) a design's product comes in, read from the S&A designer server.
const UPSTREAM = process.env.DESIGNER_API_URL || 'https://sa-product-designer.fly.dev';

const portalGet = (path, userId) => {
  const url = new URL(`${UPSTREAM}${path}`);
  url.searchParams.set('logged_in_customer_id', `portal-${userId}`);
  return fetch(url, { headers: { 'x-portal-key': process.env.PORTAL_API_KEY }, cache: 'no-store' });
};

/** { optionNames, options: [{ name, values }], variants: [{ values, available, image }] } for a design's product, or null if it can't be loaded. */
export async function fetchProductVariants(productId, userId) {
  if (!productId || !process.env.PORTAL_API_KEY) return null;
  try {
    const res = await portalGet(`/portal/products/${encodeURIComponent(productId)}/bootstrap`, userId);
    if (!res.ok) return null;
    const data = await res.json();
    const optionNames = data.optionNames || [];
    const variants = (data.variants || []).map((v) => ({ values: v.optionValues || [], available: v.availableForSale !== false, image: v.image || null }));
    const options = optionNames.map((name, i) => ({ name, values: [...new Set(variants.map((v) => v.values[i]).filter(Boolean))] }));
    return { optionNames, options, variants };
  } catch {
    return null;
  }
}

/** The product's garment views as the studio draws them: [{ name, baseImageUrl }] (front, back...), or null. */
export async function fetchProductViews(productId, userId) {
  if (!productId || !process.env.PORTAL_API_KEY) return null;
  try {
    const res = await portalGet(`/products/${encodeURIComponent(productId)}/config`, userId);
    if (!res.ok) return null;
    const data = await res.json();
    const seen = new Set();
    return (data.views || []).filter((v) => !seen.has(v.name) && seen.add(v.name)).map((v) => ({ name: v.name, baseImageUrl: v.baseImageUrl }));
  } catch {
    return null;
  }
}

export const variantKey = (values) => JSON.stringify(values);
export const colorOptionIndex = (optionNames) => (optionNames || []).findIndex((n) => /colou?r/i.test(n));
