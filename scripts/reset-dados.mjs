/**
 * Zera os dados de trabalho pra recomeçar limpo no modelo multi-tenant:
 * apaga TODOS os documentos de `leads`, `projetos`, `templates`, `buscas`,
 * `blacklist` e `perfis`, mais o doc legado `config/perfil`.
 *
 * NÃO toca em `clientes` nem em `admins`.
 *
 * Roda em dry-run por padrão. Pra apagar de verdade:
 *   npm run reset-dados -- --apply
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

const COLECOES = ["leads", "projetos", "templates", "buscas", "blacklist", "perfis"];
const LOTE = 400;

async function apagarColecao(nome) {
  let total = 0;
  for (;;) {
    const snap = await db.collection(nome).limit(LOTE).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    total += snap.size;
    if (snap.size < LOTE) break;
  }
  return total;
}

async function main() {
  const aplicar = process.argv.includes("--apply");

  const contagens = {};
  for (const nome of COLECOES) {
    contagens[nome] = (await db.collection(nome).count().get()).data().count;
  }
  const legado = (await db.collection("config").doc("perfil").get()).exists ? 1 : 0;

  console.log("Documentos que seriam apagados:");
  for (const [nome, qtd] of Object.entries(contagens)) console.log(`  ${nome}: ${qtd}`);
  if (legado) console.log(`  config/perfil (legado): 1`);

  if (!aplicar) {
    console.log("\nDry-run — nada foi apagado. Rode com --apply pra apagar de verdade.");
    return;
  }

  console.log("\nApagando...");
  for (const nome of COLECOES) {
    const n = await apagarColecao(nome);
    console.log(`  ${nome}: ${n} apagados`);
  }
  if (legado) {
    await db.collection("config").doc("perfil").delete();
    console.log("  config/perfil: apagado");
  }
  console.log("Concluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
