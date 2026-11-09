import { fetchBuffer, garmentHexFromPhoto, renderMockup } from './mockups';
import { fetchProductViews, colorOptionIndex } from './designVariants';

// Builds the design-on-a-shirt pictures for a design: one per chosen color per view (front, back...).

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

/**
 * @returns {Promise<{ views: string[], items: { color: string, view: string, buffer: Buffer }[] } | null>}
 *   null when this product can't be mocked up (no color option, no artwork, or no shirt template).
 */
export async function buildColorMockups({ design, info, colors, userId, onlyView }) {
  const colorIdx = colorOptionIndex(info.optionNames);
  if (colorIdx < 0 || !colors.length) return null;
  const previews = design.decorations?.previews || {};
  const views = (await fetchProductViews(design.product?.productId, userId)) || [];
  const usable = views.filter((v) => previews[v.name] && v.baseImageUrl && v.baseImageUrl !== 'generated-at-runtime' && (!onlyView || v.name === onlyView));
  if (!usable.length) return null;

  // Each view's template and artwork load once, then are reused for every color.
  const loaded = await Promise.all(usable.map(async (v) => ({ name: v.name, template: await fetchBuffer(v.baseImageUrl), art: await fetchBuffer(previews[v.name]) })));

  // Each color's true shade, read from that color's own product photo
  const hexByColor = {};
  await mapLimit(colors, 6, async (color) => {
    const sample = info.variants.find((v) => v.values[colorIdx] === color && v.image);
    hexByColor[color] = await garmentHexFromPhoto(sample?.image, color);
  });

  const jobs = colors.flatMap((color) => loaded.map((v) => ({ color, view: v.name, template: v.template, art: v.art })));
  const items = await mapLimit(jobs, 4, async (j) => ({ color: j.color, view: j.view, buffer: await renderMockup({ templateBuf: j.template, artworkBuf: j.art, hex: hexByColor[j.color] }) }));
  return { views: loaded.map((v) => v.name), items };
}
