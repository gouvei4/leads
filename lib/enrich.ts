export interface ResultadoEnriquecimento {
  qualidade: "fraca" | "ok";
  instagram: string | null;
  email: string | null;
  https: boolean;
  responsivo: boolean;
  tempoMs: number | null;
}

const DOMINIOS_REDE_SOCIAL = [
  "facebook.com",
  "instagram.com",
  "linktr.ee",
  "linktree.com",
  "wa.me",
  "whatsapp.com",
  "m.me",
  "bio.link",
  "beacons.ai",
];

const DOMINIOS_EMAIL_IGNORADOS = ["sentry.io", "example.com", "wixpress.com", "godaddy.com", "schema.org", "w3.org"];

const TIMEOUT_MS = 5000;
const LIMITE_LENTO_MS = 3000;

async function fetchComTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BassaniLeadsBot/1.0)" },
    });
  } finally {
    clearTimeout(timer);
  }
}

function extrairInstagram(html: string): string | null {
  const match = html.match(/https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.\-]+/);
  if (!match) return null;
  return match[0].split("?")[0].replace(/\/$/, "");
}

function extrairEmail(html: string, textoVisivel: string): string | null {
  const mailto = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (mailto) return mailto[1]!;

  const candidatos = textoVisivel.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [];
  const valido = candidatos.find((email) => !DOMINIOS_EMAIL_IGNORADOS.some((d) => email.endsWith(d)));
  return valido ?? null;
}

/**
 * Best-effort: baixa a home do lead e tenta classificar a qualidade do site
 * e achar Instagram/e-mail de contato. Qualquer falha de rede vira "fraca"
 * sem canais — nunca derruba a busca por causa de um site fora do ar.
 *
 * "tempoMs" mede o tempo de resposta do fetch (não é uma métrica real de
 * carregamento de página tipo Lighthouse, já que não rodamos um browser —
 * é um proxy honesto pra sinalizar site lento/rápido).
 */
export async function checarSite(url: string): Promise<ResultadoEnriquecimento> {
  const inicio = Date.now();
  try {
    const resp = await fetchComTimeout(url, TIMEOUT_MS);
    const tempoMs = Date.now() - inicio;
    const https = new URL(resp.url).protocol === "https:";

    if (!resp.ok) return { qualidade: "fraca", instagram: null, email: null, https, responsivo: false, tempoMs };

    const finalHost = new URL(resp.url).hostname.replace(/^www\./, "");
    if (DOMINIOS_REDE_SOCIAL.some((d) => finalHost === d || finalHost.endsWith(`.${d}`))) {
      return {
        qualidade: "fraca",
        instagram: finalHost.includes("instagram.com") ? resp.url : null,
        email: null,
        https,
        responsivo: false,
        tempoMs,
      };
    }

    const html = await resp.text();
    const textoVisivel = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const responsivo = /<meta[^>]+name=["']viewport["']/i.test(html);
    const paginaVazia = textoVisivel.length < 200;
    const lento = tempoMs > LIMITE_LENTO_MS;

    return {
      qualidade: paginaVazia || !responsivo || !https || lento ? "fraca" : "ok",
      instagram: extrairInstagram(html),
      email: extrairEmail(html, textoVisivel),
      https,
      responsivo,
      tempoMs,
    };
  } catch {
    return { qualidade: "fraca", instagram: null, email: null, https: false, responsivo: false, tempoMs: null };
  }
}
