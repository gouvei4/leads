/**
 * Migra o campo "status" dos leads existentes da taxonomia antiga (6 valores)
 * pra nova (5 valores): Negociando -> Respondeu, Sem interesse -> Recusado.
 * Novo/Contatado/Respondeu/Cliente ficam como estão.
 *
 * Por padrão roda em modo dry-run (só mostra o que mudaria, não escreve nada).
 * Pra aplicar de verdade no Firestore, rode com --apply.
 *
 * Uso:
 *   node scripts/migrate-status.mjs            (dry-run)
 *   node scripts/migrate-status.mjs --apply    (aplica de verdade)
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
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

const MAPA = {
  Negociando: "Respondeu",
  "Sem interesse": "Recusado",
};
const STATUS_NOVOS = new Set(["Novo", "Contatado", "Respondeu", "Cliente", "Recusado"]);

async function main() {
  const aplicar = process.argv.includes("--apply");

  const snap = await db.collection("leads").get();
  console.log(`Total de leads no banco: ${snap.size}`);

  const paraMigrar = [];
  const jaOk = new Set();
  const inesperados = new Map();

  snap.forEach((doc) => {
    const status = doc.data().status;
    if (status in MAPA) {
      paraMigrar.push({ id: doc.id, nome: doc.data().nome, de: status, para: MAPA[status] });
    } else if (STATUS_NOVOS.has(status)) {
      jaOk.add(status);
    } else {
      inesperados.set(status, (inesperados.get(status) ?? 0) + 1);
    }
  });

  console.log(`\nJá na taxonomia nova (sem mudança): ${snap.size - paraMigrar.length - [...inesperados.values()].reduce((a, b) => a + b, 0)}`);
  console.log(`A migrar: ${paraMigrar.length}`);
  for (const [de, para] of Object.entries(MAPA)) {
    console.log(`  "${de}" -> "${para}": ${paraMigrar.filter((l) => l.de === de).length}`);
  }
  if (inesperados.size > 0) {
    console.log(`\nStatus inesperados (não mexidos, confira manualmente):`);
    for (const [status, qtd] of inesperados) console.log(`  "${status}": ${qtd}`);
  }

  if (paraMigrar.length === 0) {
    console.log("\nNada para migrar.");
    return;
  }

  console.log(`\nExemplos (até 10):`);
  for (const item of paraMigrar.slice(0, 10)) {
    console.log(`  ${item.nome || item.id}: "${item.de}" -> "${item.para}"`);
  }

  if (!aplicar) {
    console.log(`\nDry-run — nada foi escrito. Rode com --apply pra aplicar de verdade.`);
    return;
  }

  console.log(`\nAplicando ${paraMigrar.length} atualizações...`);
  const LOTE = 450;
  for (let i = 0; i < paraMigrar.length; i += LOTE) {
    const fatia = paraMigrar.slice(i, i + LOTE);
    const batch = db.batch();
    for (const item of fatia) {
      batch.update(db.collection("leads").doc(item.id), { status: item.para });
    }
    await batch.commit();
    console.log(`  ${Math.min(i + LOTE, paraMigrar.length)}/${paraMigrar.length}`);
  }
  console.log("Concluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
