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
