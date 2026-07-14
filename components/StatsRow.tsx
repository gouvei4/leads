import styles from "./StatsRow.module.css";
import type { Stats } from "@/lib/types";

export default function StatsRow({
  stats,
  statusOptions,
}: {
  stats: Stats | null;
  statusOptions: readonly string[];
}) {
  const cards = [
    { kind: "total", label: "Total de leads", value: stats?.total ?? 0 },
    ...statusOptions.map((s) => ({ kind: s, label: s, value: stats?.por_status[s] ?? 0 })),
  ];

  return (
    <div className={styles.row}>
      {cards.map((card) => (
        <div key={card.kind} className={styles.card} data-kind={card.kind}>
          <div className={styles.num}>{card.value}</div>
          <div className={styles.label}>
            {card.kind !== "total" && <span className={styles.dot} data-kind={card.kind} />}
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
