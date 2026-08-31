import { STATUS_OPTIONS, STATUS_COLORS, type StatusOption } from "@/lib/types";

export default function StatusSelect({
  status,
  onChange,
}: {
  status: string;
  onChange: (novo: string) => void;
}) {
  const cor = STATUS_COLORS[status as StatusOption] ?? "#64748B";
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      aria-label="Mudar status"
      className="cursor-pointer rounded-full border-none py-1 pl-2.5 pr-6 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
      style={{ backgroundColor: `${cor}1A`, color: cor }}
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
