const PALETA_TAGS = [
  "#3B82F6",
  "#A78BFA",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#22D3EE",
  "#EC4899",
  "#84CC16",
  "#F97316",
  "#6366F1",
];

/** Cor determinística por nome — a mesma tag sempre sai com a mesma cor em qualquer lead. */
export function corDaTag(nome: string): string {
  const norm = nome.trim().toLowerCase();
  let h = 0;
  for (let i = 0; i < norm.length; i++) h = norm.charCodeAt(i) + ((h << 5) - h);
  return PALETA_TAGS[Math.abs(h) % PALETA_TAGS.length]!;
}
