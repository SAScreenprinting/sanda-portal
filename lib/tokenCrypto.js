import crypto from 'node:crypto';

// Store access tokens are encrypted before they are saved (AES-256-GCM), with a key that only lives in the server settings.
function key() {
  const k = process.env.STORE_TOKEN_KEY;
  if (!k) throw new Error('STORE_TOKEN_KEY is not set');
  return Buffer.from(k, 'base64');
}

export function encryptToken(plain) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return [iv.toString('base64'), c.getAuthTag().toString('base64'), enc.toString('base64')].join('.');
}

export function decryptToken(packed) {
  const [iv, tag, enc] = String(packed).split('.');
  const d = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(enc, 'base64')), d.final()]).toString('utf8');
}
