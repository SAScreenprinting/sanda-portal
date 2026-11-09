import crypto from 'node:crypto';

// A signed link to one generated mockup picture. The Shopify app hands these to Shopify, which downloads each picture
// into the client's store. Signed with the shared portal key so nobody can ask for pictures of designs they were not given.
const sign = (d, c, v, h, e) => crypto.createHmac('sha256', process.env.PORTAL_API_KEY || '').update(['mockup', d, c, v, h, e].join('|')).digest('hex').slice(0, 32);

export function mockupUrl(origin, { designId, color, view, hex, days = 3 }) {
  const e = Math.floor(Date.now() / 1000) + days * 86400;
  const u = new URL('/api/pod/mockup', origin);
  u.search = new URLSearchParams({ d: designId, c: color, v: view, h: hex, e: String(e), s: sign(designId, color, view, hex, e) }).toString();
  return u.toString();
}

export function verifyMockupParams(params) {
  const d = params.get('d'), c = params.get('c'), v = params.get('v'), h = params.get('h'), e = params.get('e'), s = params.get('s');
  if (!d || !c || !v || !/^#[0-9a-f]{6}$/i.test(h || '') || !e || !s) return null;
  if (!process.env.PORTAL_API_KEY || Number(e) < Date.now() / 1000) return null;
  const want = Buffer.from(sign(d, c, v, h, e));
  const got = Buffer.from(s);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
  return { designId: d, color: c, view: v, hex: h };
}
