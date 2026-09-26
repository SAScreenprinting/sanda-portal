import crypto from 'node:crypto';

// A client's connection code: their id plus a signature, so the Shopify app can check it without a database lookup of codes.
const sign = (hex) => crypto.createHmac('sha256', process.env.PORTAL_API_KEY || '').update('link:' + hex).digest('hex').slice(0, 10);

export function makeLinkCode(clientId) {
  const hex = String(clientId).replace(/-/g, '');
  return `${hex}.${sign(hex)}`;
}

export function parseLinkCode(code) {
  const [hex, sig] = String(code || '').trim().split('.');
  if (!/^[0-9a-f]{32}$/i.test(hex || '') || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(hex.toLowerCase()));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const h = hex.toLowerCase();
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function isPortalKey(request) {
  const key = process.env.PORTAL_API_KEY;
  const given = request.headers.get('x-portal-key');
  if (!key || !given) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(given);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
