import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Hash de senha de admin com scrypt (nativo do Node, sem dependência). Formato
 * armazenado: `scrypt$<saltHex>$<hashHex>`.
 *
 * O script scripts/criar-admin.mjs repete essa mesma lógica — se mudar aqui,
 * mude lá também.
 */

const KEYLEN = 64;

export function hashSenha(senha: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(senha, salt, KEYLEN);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function conferirSenha(senha: string, armazenado: string): boolean {
  const [algo, saltHex, hashHex] = armazenado.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const calculado = scryptSync(senha, Buffer.from(saltHex, "hex"), KEYLEN);
  return esperado.length === calculado.length && timingSafeEqual(esperado, calculado);
}
