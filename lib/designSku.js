// SKU for an approved POD design: POD-<design number>-<color>-<size>, e.g. POD-219868-BLA-S
export function makeSku(product) {
  const number = product?.designNumber || 'X';
  const parts = String(product?.variantTitle || '')
    .split('/')
    .map((p) => p.trim())
    .filter((p) => p && p.toLowerCase() !== 'default title')
    .map((p) => p.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
  const [color, size, ...rest] = parts;
  const bits = ['POD', number];
  if (color) bits.push(size ? color.slice(0, 3) : color.slice(0, 6));
  if (size) bits.push(size);
  rest.forEach((r) => bits.push(r.slice(0, 4)));
  return bits.join('-');
}

// ---- One design, many variants -------------------------------------------------------------------
// A client publishes a design as ONE product with several colors/sizes. Every variant gets the same design number,
// e.g. POD-219868-BLA-M, POD-219868-BLA-XL, POD-219868-RED-M. The number is what ties an order back to the design.

const clean = (s) => String(s ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

/** The design number inside a POD SKU ("POD-219868-BLA-M" -> "219868"), or null. */
export function designNumberFromSku(sku) {
  const m = /^POD-(\d{4,})(?:-|$)/i.exec(String(sku || '').trim());
  return m ? m[1] : null;
}

/** Short, unique codes for a list of option values ("Dark Heather", "Dark Green" -> DARKH, DARKG): as short as possible but never clashing. */
export function shortCodes(values, min = 3) {
  const list = [...new Set(values.map((v) => String(v)))];
  const full = Object.fromEntries(list.map((v) => [v, clean(v) || 'X']));
  for (let len = min; len <= 14; len++) {
    const codes = list.map((v) => full[v].slice(0, len));
    if (new Set(codes).size === list.length) return Object.fromEntries(list.map((v, i) => [v, codes[i]]));
  }
  return Object.fromEntries(list.map((v, i) => [v, `${full[v].slice(0, 12)}${i + 1}`]));
}

/** SKUs for chosen variants. `selected` is a list of value lists aligned to `optionNames`. Sizes keep their full code (2XL stays 2XL). */
export function buildVariantSkus(designNumber, optionNames, selected) {
  const codeFor = optionNames.map((name, i) => {
    const vals = selected.map((v) => v[i]);
    return /size/i.test(name) ? Object.fromEntries([...new Set(vals)].map((v) => [v, clean(v) || 'X'])) : shortCodes(vals);
  });
  return selected.map((vals) => ['POD', designNumber, ...vals.map((v, i) => codeFor[i][v])].join('-'));
}

/** Extra charge for bigger sizes: 2XL gets `extra2`, 3XL and up get `extra3`. */
export function sizeUpcharge(sizeValue, extra2 = 0, extra3 = 0) {
  const s = clean(sizeValue);
  if (/^(2XL|XXL)$/.test(s)) return extra2;
  if (/^([3-9]XL|XXXL|XXXXL)$/.test(s)) return extra3;
  return 0;
}
