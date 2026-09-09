const PLACES_BASE = "https://places.googleapis.com/v1";

export interface PlaceRadiusResultado {
  place_id: string;
  nome: string;
  endereco: string;
  telefone: string;
  site: string;
  link_maps: string;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  avaliacoes: number | null;
  bairro: string;
  cidade: string;
}

interface AddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

export function extrairComponenteEndereco(componentes: AddressComponent[] | undefined, tipos: string[]): string {
  for (const tipo of tipos) {
    const achado = componentes?.find((c) => c.types?.includes(tipo));
    if (achado) return achado.longText ?? achado.shortText ?? "";
  }
  return "";
}

export interface SugestaoLocalizacao {
  placeId: string;
  texto: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function autocompleteLocation(input: string, apiKey: string): Promise<SugestaoLocalizacao[]> {
  if (!input.trim()) return [];

  const resp = await fetch(`${PLACES_BASE}/places:autocomplete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey },
    body: JSON.stringify({ input, languageCode: "pt-BR", includedRegionCodes: ["br"] }),
  });
  if (!resp.ok) {
    const texto = await resp.text();
    throw new Error(`Autocomplete de localização erro ${resp.status}: ${texto.slice(0, 300)}`);
  }

  const data = await resp.json();
  const suggestions = data.suggestions ?? [];
  return suggestions
    .map((s: { placePrediction?: { placeId: string; text?: { text: string } } }) => s.placePrediction)
    .filter((p: unknown): p is { placeId: string; text?: { text: string } } => Boolean(p))
    .map((p: { placeId: string; text?: { text: string } }) => ({
      placeId: p.placeId,
      texto: p.text?.text ?? "",
    }));
}

export async function placeDetailsLocation(
  placeId: string,
  apiKey: string
): Promise<{ lat: number; lng: number } | null> {
  const resp = await fetch(`${PLACES_BASE}/places/${placeId}`, {
    headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "location" },
  });
  if (!resp.ok) return null;

  const data = await resp.json();
  if (!data.location) return null;
  return { lat: data.location.latitude, lng: data.location.longitude };
}

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.businessStatus",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.addressComponents",
  "nextPageToken",
].join(",");

function distanciaMetros(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export async function searchByRadius(
  nicho: string,
  center: { lat: number; lng: number },
  raioMetros: number,
  apiKey: string
): Promise<PlaceRadiusResultado[]> {
  const resultados: PlaceRadiusResultado[] = [];
  // Raio real do filtro de distância — aceita até 500km.
  const raio = Math.min(Math.max(raioMetros, 100), 500000);
  // Places (New) Text Search só aceita "circle" em locationBias (preferência de
  // ranking), não em locationRestriction (que só aceita rectangle). Além disso,
  // o circle.radius do locationBias vai só até 50km — acima disso a API rejeita.
  // Por isso o bias fica limitado a 50km e o raio real é aplicado abaixo,
  // filtrando por distância real do centro.
  const raioBias = Math.min(raio, 50000);
  const body: Record<string, unknown> = {
    textQuery: nicho,
    languageCode: "pt-BR",
    locationBias: {
      circle: { center: { latitude: center.lat, longitude: center.lng }, radius: raioBias },
    },
  };
  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": SEARCH_FIELD_MASK,
  };

  for (let pagina = 0; pagina < 3; pagina++) {
    const resp = await fetch(`${PLACES_BASE}/places:searchText`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const texto = await resp.text();
      throw new Error(`Google Places API erro ${resp.status}: ${texto.slice(0, 300)}`);
    }

    const data = await resp.json();
    for (const place of data.places ?? []) {
      if (place.businessStatus === "CLOSED_PERMANENTLY") continue;

      const lat = place.location?.latitude ?? null;
      const lng = place.location?.longitude ?? null;
      if (lat != null && lng != null && distanciaMetros(center, { lat, lng }) > raio) continue;

      resultados.push({
        place_id: place.id ?? "",
        nome: place.displayName?.text ?? "",
        endereco: place.formattedAddress ?? "",
        telefone: place.nationalPhoneNumber || place.internationalPhoneNumber || "",
        site: place.websiteUri ?? "",
        link_maps: place.googleMapsUri ?? "",
        lat,
        lng,
        rating: place.rating ?? null,
        avaliacoes: place.userRatingCount ?? null,
        bairro: extrairComponenteEndereco(place.addressComponents, ["sublocality_level_1", "sublocality", "neighborhood"]),
        cidade: extrairComponenteEndereco(place.addressComponents, ["locality", "administrative_area_level_2"]),
      });
    }

    const token = data.nextPageToken;
    if (!token) break;
    body.pageToken = token;
    await sleep(2000);
  }

  return resultados;
}
