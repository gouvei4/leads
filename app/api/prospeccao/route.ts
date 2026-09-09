import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { LEADS_COLLECTION, leadDocId } from "@/lib/leads";
import { mapWithConcurrency } from "@/lib/concurrency";
import { placeDetailsLocation, searchByRadius } from "@/lib/places";
import { checarSite } from "@/lib/enrich";
import { getTemplates } from "@/lib/templates";
import { getPerfil } from "@/lib/perfil";
import { gerarMensagemParaLead } from "@/lib/mensagemTemplate";
import { getTelefonesBloqueados } from "@/lib/blacklist";
import { commitEmLotes, type EscritaSet } from "@/lib/firestoreBatch";
import { BUSCAS_COLLECTION } from "@/lib/buscas";
import { normalizarTelefoneBr } from "@/lib/whatsapp";
import type { SiteQualidade } from "@/lib/types";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

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
  const nicho = String(data.nicho ?? "").trim();
  const localizacaoTexto = String(data.localizacao_texto ?? "").trim();
  const raioM = Number(data.raio_m ?? 5000);
  const placeId = data.place_id ? String(data.place_id) : null;
  let lat = data.lat != null ? Number(data.lat) : null;
  let lng = data.lng != null ? Number(data.lng) : null;

  if (!projetoId) {
    return NextResponse.json({ ok: false, erro: "Selecione um projeto antes de buscar." }, { status: 400 });
  }
  if (!nicho) {
    return NextResponse.json({ ok: false, erro: "Informe o nicho de busca." }, { status: 400 });
  }

  if ((lat == null || lng == null) && placeId) {
    const loc = await placeDetailsLocation(placeId, apiKey);
    if (!loc) {
      return NextResponse.json({ ok: false, erro: "Não consegui localizar esse endereço." }, { status: 400 });
    }
    lat = loc.lat;
    lng = loc.lng;
  }
  if (lat == null || lng == null) {
    return NextResponse.json(
      { ok: false, erro: "Selecione uma localização válida (use o autocomplete)." },
      { status: 400 }
    );
  }

  const db = getDb();
  const [templates, perfil, telefonesBloqueados] = await Promise.all([
    getTemplates(db),
    getPerfil(db),
    getTelefonesBloqueados(db),
  ]);

  let resultadosBrutos;
  try {
    resultadosBrutos = await searchByRadius(nicho, { lat, lng }, raioM, apiKey);
  } catch (err) {
    return NextResponse.json({ ok: false, erro: (err as Error).message }, { status: 502 });
  }

  const bloqueados = resultadosBrutos.filter((r) => {
    const tel = normalizarTelefoneBr(r.telefone);
    return tel != null && telefonesBloqueados.has(tel);
  }).length;
  const resultados = resultadosBrutos.filter((r) => {
    const tel = normalizarTelefoneBr(r.telefone);
    return !(tel != null && telefonesBloqueados.has(tel));
  });

  const semSite = resultados.filter((r) => !r.site).length;

  const enrichResults = await mapWithConcurrency(resultados, 4, async (r) => {
    if (!r.site) {
      return {
        site_qualidade: "ausente" as SiteQualidade,
        instagram: null,
        email: null,
        site_https: null,
        site_responsivo: null,
        site_tempo_ms: null,
      };
    }
    const info = await checarSite(r.site);
    return {
      site_qualidade: info.qualidade as SiteQualidade,
      instagram: info.instagram,
      email: info.email,
      site_https: info.https,
      site_responsivo: info.responsivo,
      site_tempo_ms: info.tempoMs,
    };
  });

  const buscaRef = db.collection(BUSCAS_COLLECTION).doc();

  const refs = resultados.map((r) =>
    db.collection(LEADS_COLLECTION).doc(leadDocId(projetoId, r.nome, r.endereco, r.place_id))
  );
  const snaps = refs.length > 0 ? await db.getAll(...refs) : [];

  let novos = 0;
  let duplicados = 0;
  let enriquecidos = 0;
  const agora = new Date().toISOString();
  const escritas: EscritaSet[] = [];

  snaps.forEach((snap, idx) => {
    const r = resultados[idx]!;
    const enrich = enrichResults[idx]!;
    if (enrich.instagram || enrich.email || r.rating != null) enriquecidos++;

    if (!snap.exists) {
      const mensagem = gerarMensagemParaLead(
        {
          nome: r.nome,
          termo_busca: nicho,
          bairro: r.bairro,
          cidade: r.cidade,
          rating: r.rating,
          avaliacoes: r.avaliacoes,
          site_qualidade: enrich.site_qualidade,
        },
        templates,
        perfil
      );
      const dados = {
        place_id: r.place_id,
        nome: r.nome,
        endereco: r.endereco,
        telefone: r.telefone,
        site: r.site,
        link_maps: r.link_maps,
        cidade: r.cidade,
        bairro: r.bairro,
        termo_busca: nicho,
        projeto_id: projetoId,
        status: "Novo",
        ultimo_contato: "",
        observacoes: "",
        criado_em: agora,
        lat: r.lat,
        lng: r.lng,
        rating: r.rating,
        avaliacoes: r.avaliacoes,
        instagram: enrich.instagram,
        email: enrich.email,
        site_qualidade: enrich.site_qualidade,
        site_https: enrich.site_https,
        site_responsivo: enrich.site_responsivo,
        site_tempo_ms: enrich.site_tempo_ms,
        raio_busca_m: raioM,
        busca_id: buscaRef.id,
        mensagem_gerada: mensagem.texto,
        mensagem_template_id: mensagem.templateId,
        mensagem_variacao_idx: mensagem.variacaoIdx,
        historico: [{ tipo: "criacao", data: agora }],
      };
      escritas.push({ ref: snap.ref, data: dados });
      novos++;
    } else {
      duplicados++;
    }
  });
  escritas.push({
    ref: buscaRef,
    data: {
      projeto_id: projetoId,
      nicho,
      localizacao_texto: localizacaoTexto,
      lat,
      lng,
      raio_m: raioM,
      criado_em: agora,
      total_no_raio: resultados.length,
      sem_site: semSite,
      novos,
    },
  });
  await commitEmLotes(db, escritas);

  return NextResponse.json({
    ok: true,
    novos,
    duplicados,
    bloqueados,
    total_no_raio: resultados.length,
    sem_site: semSite,
    enriquecidos,
  });
}
