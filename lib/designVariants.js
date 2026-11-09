// What colors, sizes (or other options) a design's product comes in, read from the S&A designer server.
const UPSTREAM = process.env.DESIGNER_API_URL || 'https://sa-product-designer.fly.dev';

/** { optionNames, options: [{ name, values }], variants: [{ values, available }] } for a design's product, or null if it can't be loaded. */
export async function fetchProductVariants(productId, userId) {
  if (!productId || !process.env.PORTAL_API_KEY) return null;
  try {
    const url = new URL(`${UPSTREAM}/portal/products/${encodeURIComponent(productId)}/bootstrap`);
    url.searchParams.set('logged_in_customer_id', `portal-${userId}`);
    const res = await fetch(url, { headers: { 'x-portal-key': process.env.PORTAL_API_KEY }, cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const optionNames = data.optionNames || [];
    const variants = (data.variants || []).map((v) => ({ values: v.optionValues || [], available: v.availableForSale !== false }));
    const options = optionNames.map((name, i) => ({ name, values: [...new Set(variants.map((v) => v.values[i]).filter(Boolean))] }));
    return { optionNames, options, variants };
  } catch {
    return null;
  }
}

export const variantKey = (values) => JSON.stringify(values);
