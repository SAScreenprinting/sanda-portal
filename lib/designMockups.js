import { fetchBuffer, garmentHexFromPhoto, renderMockup } from './mockups';
import { fetchProductViews, colorOptionIndex } from './designVariants';

// Builds the design-on-a-shirt pictures for a design: one per chosen color per view (front, back...).

export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

/** The views of a design that can be mocked up: it has artwork for the view and the product has a real shirt picture for it. */
export async function mockupViews(design, userId, onlyView) {
  const previews = design.decorations?.previews || {};
  const views = (await fetchProductViews(design.product?.productId, userId)) || [];
  return views.filter((v) => previews[v.name] && v.baseImageUrl && v.baseImageUrl !== 'generated-at-runtime' && (!onlyView || v.name === onlyView));
}

/** The true shade of each color, read from that color's own product photo: { Color: '#rrggbb' }. */
export async function colorHexes(info, colors) {
  const colorIdx = colorOptionIndex(info.optionNames);
  const hexByColor = {};
  await mapLimit(colors, 6, async (color) => {
    const sample = info.variants.find((v) => v.values[colorIdx] === color && v.image);
    hexByColor[color] = await garmentHexFromPhoto(sample?.image, color);
  });
  return hexByColor;
}

/** One finished mockup picture (JPEG) of a design on a shirt of color `hex`, for one view. */
export async function renderViewMockup({ design, view, hex, userId }) {
  const [v] = await mockupViews(design, userId, view);
  if (!v) return null;
  const [template, art] = await Promise.all([fetchBuffer(v.baseImageUrl), fetchBuffer(design.decorations.previews[v.name])]);
  return renderMockup({ templateBuf: template, artworkBuf: art, hex });
}

/**
 * @returns {Promise<{ views: string[], items: { color: string, view: string, buffer: Buffer }[] } | null>}
 *   null when this product can't be mocked up (no color option, no artwork, or no shirt template).
 */
export async function buildColorMockups({ design, info, colors, userId, onlyView }) {
  const colorIdx = colorOptionIndex(info.optionNames);
  if (colorIdx < 0 || !colors.length) return null;
  const usable = await mockupViews(design, userId, onlyView);
  if (!usable.length) return null;

  // Each view's template and artwork load once, then are reused for every color.
  const loaded = await Promise.all(usable.map(async (v) => ({ name: v.name, template: await fetchBuffer(v.baseImageUrl), art: await fetchBuffer(design.decorations.previews[v.name]) })));
  const hexByColor = await colorHexes(info, colors);

  const jobs = colors.flatMap((color) => loaded.map((v) => ({ color, view: v.name, template: v.template, art: v.art })));
  const items = await mapLimit(jobs, 4, async (j) => ({ color: j.color, view: j.view, buffer: await renderMockup({ templateBuf: j.template, artworkBuf: j.art, hex: hexByColor[j.color] }) }));
  return { views: loaded.map((v) => v.name), items };
}
