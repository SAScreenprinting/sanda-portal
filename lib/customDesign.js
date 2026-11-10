// A "custom" POD product: S&A uploads the pictures and types the blank's name and the colors and sizes by hand,
// instead of picking a catalog product in the Design Studio. It is stored inside the saved design's `product.custom`.
//
//   custom = {
//     blank: 'Gildan 64000 Softstyle',            // the garment, shown to whoever prints it
//     colors: [{ name: 'Black', image: 'https://…' | null }],   // image = photo of that color with the design on it
//     sizes: ['S', 'M', 'L'],
//     variants: [['Black', 'S'], ['Black', 'M']],  // the color/size combinations that exist
//     cost: 12.5 | null, suggested: 24.99 | null
//   }

export const CUSTOM_OPTION_NAMES = ['Color', 'Size'];
export const MAX_COLORS = 60;
export const MAX_SIZES = 20;
export const MAX_VARIANTS = 250;

export const isCustom = (design) => !!design?.product?.custom;

const text = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const money = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
};

/**
 * Checks what the admin form sent and returns the clean `custom` object, or { error }.
 * `imagePrefix` is where uploaded pictures must live (our own storage), so nobody can point a product at a random link.
 */
export function sanitizeCustom(input, { imagePrefix } = {}) {
  const okImage = (u) => {
    if (!u) return null;
    const s = String(u);
    return imagePrefix && s.startsWith(imagePrefix) && s.length < 600 ? s : undefined;
  };

  const blank = text(input?.blank, 120);
  if (!blank) return { error: 'Enter the blank (the garment name, for example "Gildan 64000").' };

  const colors = [];
  const seenColors = new Set();
  for (const c of Array.isArray(input?.colors) ? input.colors : []) {
    const name = text(c?.name, 40);
    if (!name) continue;
    if (seenColors.has(name.toLowerCase())) return { error: `The color "${name}" is listed twice.` };
    seenColors.add(name.toLowerCase());
    const image = okImage(c?.image);
    if (image === undefined) return { error: `The picture for ${name} must be one you uploaded here.` };
    colors.push({ name, image });
  }
  if (colors.length === 0) return { error: 'Add at least one color.' };
  if (colors.length > MAX_COLORS) return { error: `Use ${MAX_COLORS} colors or fewer.` };

  const sizes = [];
  const seenSizes = new Set();
  for (const s of Array.isArray(input?.sizes) ? input.sizes : []) {
    const name = text(s, 12);
    if (!name || seenSizes.has(name.toLowerCase())) continue;
    seenSizes.add(name.toLowerCase());
    sizes.push(name);
  }
  if (sizes.length === 0) return { error: 'Add at least one size.' };
  if (sizes.length > MAX_SIZES) return { error: `Use ${MAX_SIZES} sizes or fewer.` };

  // Only combinations of a listed color and a listed size count, each once, in the order the colors and sizes were listed.
  const wanted = new Set();
  for (const v of Array.isArray(input?.variants) ? input.variants : []) {
    if (!Array.isArray(v) || v.length !== 2) return { error: 'One of the color and size combinations is not valid.' };
    const color = colors.find((c) => c.name.toLowerCase() === text(v[0], 40).toLowerCase());
    const size = sizes.find((s) => s.toLowerCase() === text(v[1], 12).toLowerCase());
    if (!color || !size) return { error: 'One of the color and size combinations uses a color or size that is not in your lists.' };
    wanted.add(`${color.name}\u0000${size}`);
  }
  const variants = [];
  for (const c of colors) for (const s of sizes) if (wanted.has(`${c.name}\u0000${s}`)) variants.push([c.name, s]);
  if (variants.length === 0) return { error: 'Choose at least one color and size combination.' };
  if (variants.length > MAX_VARIANTS) return { error: `That is ${variants.length} variants. Shopify allows ${MAX_VARIANTS} per product here, so use fewer.` };

  const cost = money(input?.cost);
  const suggested = money(input?.suggested);
  if (Number.isNaN(cost) || Number.isNaN(suggested)) return { error: 'Prices must be numbers like 12.50.' };

  // Colors that have no variant left are dropped so the product never lists an empty color.
  const used = new Set(variants.map((v) => v[0]));
  return { custom: { blank, colors: colors.filter((c) => used.has(c.name)), sizes: sizes.filter((s) => variants.some((v) => v[1] === s)), variants, cost, suggested } };
}

/** The same shape `fetchProductVariants` returns for a catalog product, so the rest of the app treats both alike. */
export function customInfo(design) {
  const c = design?.product?.custom;
  if (!c) return null;
  const image = Object.fromEntries((c.colors || []).map((x) => [x.name, x.image || null]));
  const variants = (c.variants || []).map((values) => ({ values, available: true, image: image[values[0]] || null }));
  return {
    optionNames: CUSTOM_OPTION_NAMES,
    options: [
      { name: 'Color', values: (c.colors || []).map((x) => x.name) },
      { name: 'Size', values: c.sizes || [] },
    ],
    variants,
  };
}

/** One uploaded picture per color that has one: [{ color, view, url }]. */
export function customColorPictures(design, colors) {
  const c = design?.product?.custom;
  if (!c) return [];
  const want = colors ? new Set(colors) : null;
  return (c.colors || []).filter((x) => x.image && (!want || want.has(x.name))).map((x) => ({ color: x.name, view: 'Front', url: x.image }));
}
