import type { Lead } from "@/lib/types";
import { ehCelularBr, normalizarTelefoneBr } from "@/lib/whatsapp";

function Chip({ ativo, label }: { ativo: boolean; label: string }) {
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        ativo ? "bg-primary/15 text-primary" : "bg-surface-2 text-ink-muted/50 line-through"
      }`}
    >
      {label}
    </span>
  );
}

export type Canal = "whatsapp" | "instagram" | "email";

export function canaisDoLead(lead: Lead): Record<Canal, boolean> {
  const tel = normalizarTelefoneBr(lead.telefone || "");
  return {
    whatsapp: Boolean(tel && ehCelularBr(tel)),
    instagram: Boolean(lead.instagram),
    email: Boolean(lead.email),
  };
}

export default function ChannelChips({ lead }: { lead: Lead }) {
  const canais = canaisDoLead(lead);
  return (
    <div className="flex flex-wrap gap-1">
      <Chip ativo={canais.whatsapp} label="WhatsApp" />
      <Chip ativo={Boolean(lead.site)} label="Site" />
      <Chip ativo={canais.instagram} label="Instagram" />
      <Chip ativo={canais.email} label="E-mail" />
    </div>
  );
}
