import { NextRequest, NextResponse } from "next/server";
import type { Firestore } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebaseAdmin";
import { LEADS_COLLECTION, leadDocId } from "@/lib/leads";
import { mapWithConcurrency } from "@/lib/concurrency";
import { extrairComponenteEndereco } from "@/lib/places";
import { getTemplates } from "@/lib/templates";
import { getPerfil } from "@/lib/perfil";
import { gerarMensagemParaLead } from "@/lib/mensagemTemplate";
import { getTelefonesBloqueados } from "@/lib/blacklist";
import { normalizarTelefoneBr } from "@/lib/whatsapp";
import type { MessageTemplate } from "@/lib/types";

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
  "places.addressComponents",
  "nextPageToken",
].join(",");

interface PlaceResultado {
  nome: string;
  endereco: string;
  telefone: string;
  site: string;
  link_maps: string;
  cidade: string;
  bairro: string;
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
        bairro: extrairComponenteEndereco(place.addressComponents, [
          "sublocality_level_1",
          "sublocality",
          "neighborhood",
        ]),
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

interface ComboResultado {
  logLine: string;
  erro: string | null;
  novos: number;
  duplicados: number;
}

async function processarCombo(
  termo: string,
  cidade: string,
  apiKey: string,
  projetoId: string,
  db: Firestore,
  templates: MessageTemplate[],
  perfil: { meu_nome: string; meu_link: string },
  telefonesBloqueados: Set<string>
): Promise<ComboResultado> {
  let resultados: PlaceResultado[] = [];
  try {
    resultados = await buscarPlaces(termo, cidade, apiKey);
    resultados = resultados.filter((r) => {
      const tel = normalizarTelefoneBr(r.telefone);
      return !(tel != null && telefonesBloqueados.has(tel));
    });
  } catch (err) {
    const msg = (err as Error).message;
    return {
      logLine: `ERRO em '${termo}' - ${cidade}: ${msg}`,
      erro: `${termo} / ${cidade}: ${msg}`,
      novos: 0,
      duplicados: 0,
    };
  }

  const refs = resultados.map((r) =>
    db.collection(LEADS_COLLECTION).doc(leadDocId(projetoId, r.nome, r.endereco))
  );
  const snaps = refs.length > 0 ? await db.getAll(...refs) : [];

  let novos = 0;
  let duplicados = 0;
  const escritas: Promise<unknown>[] = [];
  snaps.forEach((snap, idx) => {
    if (!snap.exists) {
      const r = resultados[idx]!;
      const mensagem = gerarMensagemParaLead(r, templates, perfil);
      escritas.push(
        snap.ref.set({
          ...r,
          projeto_id: projetoId,
          status: "Novo",
          ultimo_contato: "",
          observacoes: "",
          criado_em: new Date().toISOString(),
          mensagem_gerada: mensagem.texto,
          mensagem_template_id: mensagem.templateId,
          mensagem_variacao_idx: mensagem.variacaoIdx,
          historico: [{ tipo: "criacao", data: new Date().toISOString() }],
        })
      );
      novos++;
    } else {
      duplicados++;
    }
  });
  await Promise.all(escritas);

  return {
    logLine: `'${termo}' em ${cidade}: ${resultados.length} encontrados, ${novos} novos`,
    erro: null,
    novos,
    duplicados,
  };
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
  const [templates, perfil, telefonesBloqueados] = await Promise.all([
    getTemplates(db),
    getPerfil(db),
    getTelefonesBloqueados(db),
  ]);
  const combos = cidades.flatMap((cidade) => termos.map((termo) => ({ cidade, termo })));

  const CONCURRENCY = 4;
  const resultadosCombos = await mapWithConcurrency(combos, CONCURRENCY, ({ termo, cidade }) =>
    processarCombo(termo, cidade, apiKey, projetoId, db, templates, perfil, telefonesBloqueados)
  );

  let novos = 0;
  let duplicados = 0;
  const erros: string[] = [];
  const log: string[] = [];
  for (const r of resultadosCombos) {
    novos += r.novos;
    duplicados += r.duplicados;
    if (r.erro) erros.push(r.erro);
    log.push(r.logLine);
  }

  return NextResponse.json({ ok: true, novos, duplicados, erros, log });
}
