import sharp from 'sharp';

// Product mockups: the design on a shirt in each color. The studio draws a plain white shirt template stretched to its
// 480x560 canvas and saves the artwork alone as a transparent PNG on that same canvas. So a mockup is just:
// template (stretched to the artwork's size) x garment color, with the artwork laid on top.

export const MOCKUP_W = 960;
export const MOCKUP_H = 1120;

const hexToRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return [226, 226, 226];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (r, g, b) => '#' + [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');

// A few apparel colors the photo sampling can fall back on (a missing/odd photo), plain CSS names otherwise.
const KNOWN = { black: '#1d1d1f', white: '#f1f1f2', navy: '#212e42', 'sport grey': '#a8adb3', 'sport gray': '#a8adb3', 'ash grey': '#c8c9c7', red: '#b82336', royal: '#165099', maroon: '#582333' };

async function fetchBuffer(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not load image (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * The real color of a garment, read from the middle of the chest in that color's own product photo (so any color name
 * works, heathers included). Falls back to a known name, then a neutral grey, if the photo can't be read.
 */
export async function garmentHexFromPhoto(imageUrl, colorName) {
  try {
    if (imageUrl) {
      const buf = await fetchBuffer(imageUrl);
      const m = await sharp(buf).metadata();
      const crop = await sharp(buf)
        .extract({ left: Math.round(m.width * 0.4), top: Math.round(m.height * 0.34), width: Math.max(2, Math.round(m.width * 0.2)), height: Math.max(2, Math.round(m.height * 0.12)) })
        .toBuffer();
      const st = await sharp(crop).stats();
      const [r, g, b] = st.channels.slice(0, 3).map((c) => c.mean);
      // A near-white or fully empty sample means the shirt was not under the box (flat-lay photo, background): don't trust it.
      const looksLikeBackground = r > 250 && g > 250 && b > 250;
      if (!looksLikeBackground) return toHex(r, g, b);
    }
  } catch {
    /* fall through to the name */
  }
  const key = String(colorName || '').trim().toLowerCase();
  return KNOWN[key] || '#e2e2e2';
}

/** One mockup JPEG: the white shirt template multiplied by `hex`, the transparent artwork PNG laid on top. */
export async function renderMockup({ templateBuf, artworkBuf, hex }) {
  const [tr, tg, tb] = hexToRgb(hex);
  const { data } = await sharp(templateBuf).ensureAlpha().resize(MOCKUP_W, MOCKUP_H, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    data[i] = (data[i] * tr) / 255;
    data[i + 1] = (data[i + 1] * tg) / 255;
    data[i + 2] = (data[i + 2] * tb) / 255;
  }
  const shirt = await sharp(data, { raw: { width: MOCKUP_W, height: MOCKUP_H, channels: 4 } }).png().toBuffer();
  const art = await sharp(artworkBuf).ensureAlpha().resize(MOCKUP_W, MOCKUP_H, { fit: 'fill' }).png().toBuffer();
  return sharp({ create: { width: MOCKUP_W, height: MOCKUP_H, channels: 3, background: '#ffffff' } })
    .composite([{ input: shirt }, { input: art }])
    .jpeg({ quality: 88 })
    .toBuffer();
}

export { fetchBuffer };
