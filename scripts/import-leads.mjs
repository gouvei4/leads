/**
 * Importa leads de um arquivo CSV ou XLSX (formato antigo do app Flask)
 * para o Firestore, associando tudo a um cliente e a um projeto (cria o
 * projeto se nao existir ainda). Nao duplica quem ja existir (mesmo cliente
 * + projeto + nome + endereco).
 *
 * Uso:
 *   node scripts/import-leads.mjs leads_cacambas.csv CLIENTE_ID "Cacambas"
 *   node scripts/import-leads.mjs leads_20260707.xlsx CLIENTE_ID "Cacambas"
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Faltam FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY no .env.local");
  process.exit(1);
}

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

// nomes de coluna aceitos (minusculo, sem acento) -> campo interno
const MAPA_COLUNAS = {
  nome: "nome",
  telefone: "telefone",
  endereco: "endereco",
  cidade: "cidade",
  site: "site",
  link_maps: "link_maps",
  "link maps": "link_maps",
  termo_busca: "termo_busca",
  "termo da busca": "termo_busca",
  busca: "busca_completa", // formato antigo: "termo - cidade"
  status: "status",
  ultimo_contato: "ultimo_contato",
  "ultimo contato": "ultimo_contato",
  observacoes: "observacoes",
};

function normalizar(texto) {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function leadDocId(dono, projetoId, nome, endereco) {
  const key = `${dono}|${projetoId}|${nome.trim().toLowerCase()}|${endereco.trim().toLowerCase()}`;
  return createHash("sha1").update(key).digest("hex");
}

async function acharOuCriarProjeto(dono, nomeProjeto) {
  const snap = await db
    .collection("projetos")
    .where("dono", "==", dono)
    .where("nome", "==", nomeProjeto)
    .limit(1)
    .get();
  if (!snap.empty) return snap.docs[0].id;

  const ref = db.collection("projetos").doc();
  await ref.set({ nome: nomeProjeto, dono, criado_em: new Date().toISOString() });
  return ref.id;
}

function lerCsv(caminho) {
  const conteudo = readFileSync(caminho, "utf-8");
  const linhas = parse(conteudo, { columns: true, skip_empty_lines: true, bom: true });
  const colunas = linhas.length > 0 ? Object.keys(linhas[0]) : [];
  return { linhas, colunas };
}

async function lerXlsx(caminho) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(caminho);
  const sheet = workbook.getWorksheet("Leads") ?? workbook.worksheets[0];

  const linhasBrutas = [];
  sheet.eachRow((row) => linhasBrutas.push(row.values.slice(1)));
  if (linhasBrutas.length === 0) return { linhas: [], colunas: [] };

  const colunas = linhasBrutas[0].map((c) => (c == null ? "" : String(c)));
  const linhas = linhasBrutas.slice(1).map((row) => {
    const obj = {};
    colunas.forEach((col, i) => {
      const v = row[i];
      obj[col] = v == null ? "" : String(v);
    });
    return obj;
  });
  return { linhas, colunas };
}

function mapearLinha(linhaBruta, colunas) {
  const resultado = {};
  for (const colOriginal of colunas) {
    const chaveNorm = normalizar(colOriginal);
    const campoInterno = MAPA_COLUNAS[chaveNorm];
    if (!campoInterno) continue;
    const valor = linhaBruta[colOriginal];
    resultado[campoInterno] = valor == null ? "" : String(valor).trim();
  }

  // formato antigo do CSV: coluna "busca" tipo "termo - cidade"
  if (resultado.busca_completa && !resultado.termo_busca) {
    const idx = resultado.busca_completa.indexOf(" - ");
    if (idx !== -1) {
      resultado.termo_busca = resultado.busca_completa.slice(0, idx).trim();
      if (!resultado.cidade) resultado.cidade = resultado.busca_completa.slice(idx + 3).trim();
    }
  }

  // planilha CRM troca o texto do link por "Abrir no Maps"; sem o valor real, deixa vazio
  if (!resultado.link_maps || resultado.link_maps.toLowerCase() === "abrir no maps") {
    resultado.link_maps = "";
  }

  return resultado;
}

async function main() {
  const caminho = process.argv[2];
  const dono = process.argv[3]?.trim();
  const nomeProjeto = process.argv[4]?.trim();
  if (!caminho || !dono || !nomeProjeto) {
    console.error('Uso: node scripts/import-leads.mjs arquivo.csv (ou .xlsx) CLIENTE_ID "Nome do Projeto"');
    process.exit(1);
  }
  const cliente = await db.collection("clientes").doc(dono).get();
  if (!cliente.exists) {
    console.error(`Cliente "${dono}" nao encontrado na colecao clientes.`);
    process.exit(1);
  }
  const projetoId = await acharOuCriarProjeto(dono, nomeProjeto);

  const ext = caminho.split(".").pop().toLowerCase();
  let linhas, colunas;
  if (ext === "csv") {
    ({ linhas, colunas } = lerCsv(caminho));
  } else if (ext === "xlsx" || ext === "xlsm") {
    ({ linhas, colunas } = await lerXlsx(caminho));
  } else {
    console.error(`Formato ".${ext}" nao suportado. Use .csv ou .xlsx.`);
    process.exit(1);
  }

  if (linhas.length === 0) {
    console.log("Nenhuma linha encontrada no arquivo.");
    return;
  }

  let novos = 0;
  let atualizados = 0;
  let duplicados = 0;
  let ignorados = 0;

  for (const linhaBruta of linhas) {
    const item = mapearLinha(linhaBruta, colunas);
    const nome = (item.nome ?? "").trim();
    if (!nome) {
      ignorados++;
      continue;
    }
    const endereco = item.endereco ?? "";

    const ref = db.collection("leads").doc(leadDocId(dono, projetoId, nome, endereco));
    const snap = await ref.get();

    if (!snap.exists) {
      const criadoEm = new Date().toISOString();
      await ref.set({
        dono,
        projeto_id: projetoId,
        nome,
        telefone: item.telefone ?? "",
        endereco,
        cidade: item.cidade ?? "",
        site: item.site ?? "",
        link_maps: item.link_maps ?? "",
        termo_busca: item.termo_busca ?? "",
        status: item.status || "Novo",
        ultimo_contato: item.ultimo_contato ?? "",
        observacoes: item.observacoes ?? "",
        criado_em: criadoEm,
        historico: [{ tipo: "criacao", data: criadoEm }],
      });
      novos++;
      continue;
    }

    // ja existe: so atualiza status/ultimo_contato/observacoes se a planilha trouxer algo (formato CRM)
    const updates = {};
    for (const campo of ["status", "ultimo_contato", "observacoes"]) {
      if (item[campo]) updates[campo] = item[campo];
    }
    if (Object.keys(updates).length > 0) {
      await ref.set(updates, { merge: true });
      atualizados++;
    } else {
      duplicados++;
    }
  }

  console.log(
    `Cliente ${dono} | Projeto "${nomeProjeto}" (${projetoId})\n` +
      `Novos: ${novos} | Atualizados (ja existiam, campos CRM aplicados): ${atualizados} | ` +
      `Ja existiam (sem mudanca): ${duplicados} | Ignorados (sem nome): ${ignorados}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
