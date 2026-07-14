import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { LEADS_COLLECTION, leadDocId } from "@/lib/leads";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const PLACES_URL = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = [
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.businessStatus",
  "nextPageToken",
].join(",");

interface PlaceResultado {
  nome: string;
  endereco: string;
  telefone: string;
  site: string;
  link_maps: string;
  cidade: string;
  termo_busca: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function buscarPlaces(termo: string, cidade: string, apiKey: string): Promise<PlaceResultado[]> {
  const resultados: PlaceResultado[] = [];
  const body: Record<string, unknown> = { textQuery: `${termo} ${cidade}`, languageCode: "pt-BR" };
  const headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": FIELD_MASK,
  };

  for (let pagina = 0; pagina < 3; pagina++) {
    const resp = await fetch(PLACES_URL, { method: "POST", headers, body: JSON.stringify(body) });
    if (!resp.ok) {
      const texto = await resp.text();
      throw new Error(`Google Places API erro ${resp.status}: ${texto.slice(0, 300)}`);
    }

    const data = await resp.json();
    for (const place of data.places ?? []) {
      if (place.businessStatus === "CLOSED_PERMANENTLY") continue;
      resultados.push({
        nome: place.displayName?.text ?? "",
        endereco: place.formattedAddress ?? "",
        telefone: place.nationalPhoneNumber || place.internationalPhoneNumber || "",
        site: place.websiteUri ?? "",
        link_maps: place.googleMapsUri ?? "",
        cidade,
        termo_busca: termo,
      });
    }

    const token = data.nextPageToken;
    if (!token) break;
    body.pageToken = token;
    await sleep(2000);
  }

  return resultados;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, erro: "Configure GOOGLE_PLACES_KEY no arquivo .env.local (veja o README)." },
      { status: 400 }
    );
  }

  const data = await request.json();
  const projetoId = String(data.projeto_id ?? "").trim();
  const termos: string[] = (data.termos ?? []).map((t: string) => t.trim()).filter(Boolean);
  const cidades: string[] = (data.cidades ?? []).map((c: string) => c.trim()).filter(Boolean);

  if (!projetoId) {
    return NextResponse.json({ ok: false, erro: "Selecione um projeto antes de buscar." }, { status: 400 });
  }
  if (termos.length === 0 || cidades.length === 0) {
    return NextResponse.json({ ok: false, erro: "Informe pelo menos 1 termo e 1 cidade." }, { status: 400 });
  }

  const db = getDb();
  let novos = 0;
  let duplicados = 0;
  const erros: string[] = [];
  const log: string[] = [];

  const combos = cidades.flatMap((cidade) => termos.map((termo) => ({ cidade, termo })));

  for (let i = 0; i < combos.length; i++) {
    const { cidade, termo } = combos[i]!;
    let resultados: PlaceResultado[] = [];
    try {
      resultados = await buscarPlaces(termo, cidade, apiKey);
    } catch (err) {
      const msg = (err as Error).message;
      erros.push(`${termo} / ${cidade}: ${msg}`);
      log.push(`ERRO em '${termo}' - ${cidade}: ${msg}`);
      continue;
    }

    const refs = resultados.map((r) =>
      db.collection(LEADS_COLLECTION).doc(leadDocId(projetoId, r.nome, r.endereco))
    );
    const snaps = refs.length > 0 ? await db.getAll(...refs) : [];

    let adicionadosNestaBusca = 0;
    const escritas: Promise<unknown>[] = [];
    snaps.forEach((snap, idx) => {
      if (!snap.exists) {
        escritas.push(
          snap.ref.set({
            ...resultados[idx],
            projeto_id: projetoId,
            status: "Novo",
            ultimo_contato: "",
            observacoes: "",
            criado_em: new Date().toISOString(),
          })
        );
        novos++;
        adicionadosNestaBusca++;
      } else {
        duplicados++;
      }
    });
    await Promise.all(escritas);

    log.push(`'${termo}' em ${cidade}: ${resultados.length} encontrados, ${adicionadosNestaBusca} novos`);

    if (i < combos.length - 1) await sleep(1000);
  }

  return NextResponse.json({ ok: true, novos, duplicados, erros, log });
}
