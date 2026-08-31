import type { SiteQualidade } from "@/lib/types";

const CONFIG: Record<SiteQualidade, { label: string; cor: string }> = {
  ausente: { label: "Sem site", cor: "var(--color-status-recusado)" },
  fraca: { label: "Site fraco", cor: "var(--color-status-negociando)" },
  ok: { label: "Site OK", cor: "var(--color-status-cliente)" },
};

export default function SiteQualityBadge({ qualidade }: { qualidade: SiteQualidade | undefined }) {
  if (!qualidade) return null;
  const cfg = CONFIG[qualidade];
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: `color-mix(in srgb, ${cfg.cor} 15%, transparent)`, color: cfg.cor }}
    >
      {cfg.label}
    </span>
  );
}
