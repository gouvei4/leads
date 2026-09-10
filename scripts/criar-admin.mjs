/**
 * Cria (ou atualiza a senha de) um usuário admin na coleção `admins` do
 * Firestore. Esse é o login do painel /admin, onde você gera os tokens.
 *
 * Uso:
 *   npm run criar-admin -- voce@exemplo.com "uma-senha-forte"
 *
 * O hash da senha usa scrypt no mesmo formato de lib/senha.ts — se mudar lá,
 * mude aqui também.
 */
import { randomBytes, scryptSync } from "node:crypto";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

function hashSenha(senha) {
  const salt = randomBytes(16);
  const hash = scryptSync(senha, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

const [, , emailArg, senha] = process.argv;
const email = (emailArg ?? "").trim().toLowerCase();

if (!email || !senha) {
  console.error('Uso: npm run criar-admin -- email@exemplo.com "senha-forte"');
  process.exit(1);
}
if (senha.length < 8) {
  console.error("A senha precisa ter pelo menos 8 caracteres.");
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Faltam FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY no .env.local");
  process.exit(1);
}

initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

async function main() {
  const existentes = await db.collection("admins").where("email", "==", email).limit(1).get();
  const senha_hash = hashSenha(senha);

  if (!existentes.empty) {
    await existentes.docs[0].ref.set({ senha_hash }, { merge: true });
    console.log(`Senha do admin ${email} atualizada.`);
    return;
  }

  await db.collection("admins").doc().set({
    email,
    senha_hash,
    nome: email,
    criado_em: new Date().toISOString(),
  });
  console.log(`Admin ${email} criado. Acesse /admin pra gerar tokens.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
