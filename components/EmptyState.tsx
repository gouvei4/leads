import styles from "./EmptyState.module.css";
import { InboxIcon } from "./icons";

export default function EmptyState() {
  return (
    <div className={styles.empty}>
      <InboxIcon />
      <div className={styles.big}>Nenhum lead ainda</div>
      <div>
        Vá na aba <strong>Buscar</strong> pra puxar suas primeiras empresas.
      </div>
    </div>
  );
}
