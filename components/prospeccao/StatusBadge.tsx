import { STATUS_COLORS, type StatusOption } from "@/lib/types";

export default function StatusBadge({ status }: { status: string }) {
  const cor = STATUS_COLORS[status as StatusOption] ?? "#64748B";
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: `${cor}1A`, color: cor }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
      {status}
    </span>
  );
}
