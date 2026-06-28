/**
 * Geocoding helpers — sem API key.
 *
 * Estratégia:
 *  1. Se houver CEP (8 dígitos), tenta BrasilAPI → ViaCEP para completar
 *     cidade/UF/logradouro.
 *  2. Em seguida usa Nominatim (OpenStreetMap) para resolver lat/lng a partir
 *     do endereço completo. Sem chave, com User-Agent identificável.
 *
 * Nominatim exige até 1 req/s e atribuição. Use apenas em ações disparadas
 * pelo usuário (clique em "Buscar coordenadas").
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName?: string;
}

export interface CepResult {
  street?: string;
  city?: string;
  state?: string;
  neighborhood?: string;
}

const onlyDigits = (s: string) => s.replace(/\D+/g, '');

export async function lookupCep(cep: string): Promise<CepResult | null> {
  const clean = onlyDigits(cep);
  if (clean.length !== 8) return null;
  try {
    const r = await fetch(`https://brasilapi.com.br/api/cep/v2/${clean}`);
    if (r.ok) {
      const j = await r.json();
      return {
        street: j.street ?? undefined,
        city: j.city ?? undefined,
        state: j.state ?? undefined,
        neighborhood: j.neighborhood ?? undefined,
      };
    }
  } catch {/* fallback */}
  try {
    const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (r.ok) {
      const j = await r.json();
      if (!j.erro) {
        return {
          street: j.logradouro || undefined,
          city: j.localidade || undefined,
          state: j.uf || undefined,
          neighborhood: j.bairro || undefined,
        };
      }
    }
  } catch {/* ignore */}
  return null;
}

export async function geocodeAddress(parts: {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}): Promise<GeocodeResult | null> {
  const q = [parts.address, parts.city, parts.state, parts.zip, parts.country ?? 'Brasil']
    .filter(Boolean)
    .join(', ');
  if (!q.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(q)}`;
    const r = await fetch(url, {
      headers: { 'Accept-Language': 'pt-BR' },
    });
    if (!r.ok) return null;
    const arr = (await r.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!arr.length) return null;
    const hit = arr[0];
    const lat = Number(hit.lat);
    const lon = Number(hit.lon);
    if (!isFinite(lat) || !isFinite(lon)) return null;
    return { latitude: lat, longitude: lon, displayName: hit.display_name };
  } catch {
    return null;
  }
}
