// Shared HMAC helper for verifying signed webhook payloads.
// Uses Web Crypto (SubtleCrypto) for HMAC-SHA256 and a timing-safe comparison.

function hexToBytes(hex: string): Uint8Array | null {
  const clean = hex.trim().toLowerCase().replace(/^0x/, '');
  if (clean.length === 0 || clean.length % 2 !== 0 || !/^[0-9a-f]+$/.test(clean)) return null;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}

function base64ToBytes(b64: string): Uint8Array | null {
  try {
    const bin = atob(b64.trim());
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function computeHmacSha256(secret: string, payload: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return new Uint8Array(sig);
}

/**
 * Verifies an HMAC-SHA256 signature header.
 * Accepts hex (preferred), base64, or "sha256=<hex>" formats.
 * Returns false for any malformed header — never throws.
 */
export async function verifyHmacSignature(
  secret: string,
  rawBody: string,
  headerValue: string | null | undefined,
): Promise<boolean> {
  if (!secret || !headerValue) return false;
  const expected = await computeHmacSha256(secret, rawBody);

  const candidates: string[] = [];
  const raw = headerValue.trim();
  candidates.push(raw);
  if (raw.toLowerCase().startsWith('sha256=')) candidates.push(raw.slice(7).trim());

  for (const cand of candidates) {
    const asHex = hexToBytes(cand);
    if (asHex && timingSafeEqual(asHex, expected)) return true;
    const asB64 = base64ToBytes(cand);
    if (asB64 && timingSafeEqual(asB64, expected)) return true;
  }
  return false;
}

export async function hmacHex(secret: string, payload: string): Promise<string> {
  return bytesToHex(await computeHmacSha256(secret, payload));
}
