import styles from "./Pagination.module.css";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

interface PaginationProps {
  paginaAtual: number;
  totalItens: number;
  pageSize: number;
  onGoToPage: (n: number) => void;
}

export default function Pagination({ paginaAtual, totalItens, pageSize, onGoToPage }: PaginationProps) {
  if (totalItens <= pageSize) return null;

  const totalPaginas = Math.max(1, Math.ceil(totalItens / pageSize));
  const inicio = (paginaAtual - 1) * pageSize + 1;
  const fim = Math.min(paginaAtual * pageSize, totalItens);

  const nums = new Set([1, totalPaginas, paginaAtual - 1, paginaAtual, paginaAtual + 1]);
  const ordenados = [...nums].filter((n) => n >= 1 && n <= totalPaginas).sort((a, b) => a - b);

  const paginas: (number | "ellipsis")[] = [];
  let anterior = 0;
  for (const n of ordenados) {
    if (anterior && n - anterior > 1) paginas.push("ellipsis");
    paginas.push(n);
    anterior = n;
  }

  return (
    <div className={styles.pagination}>
      <div className={styles.info}>
        Mostrando {inicio}–{fim} de {totalItens} leads
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.pageBtn}
          disabled={paginaAtual === 1}
          onClick={() => onGoToPage(paginaAtual - 1)}
          title="Anterior"
        >
          <ChevronLeftIcon />
        </button>
        {paginas.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e${i}`} className={styles.ellipsis}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`${styles.pageBtn} ${p === paginaAtual ? styles.pageBtnActive : ""}`}
              onClick={() => onGoToPage(p)}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          className={styles.pageBtn}
          disabled={paginaAtual === totalPaginas}
          onClick={() => onGoToPage(paginaAtual + 1)}
          title="Próxima"
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}
