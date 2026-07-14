"use client";

import styles from "./LeadsToolbar.module.css";
import formStyles from "./form.module.css";
import Button from "./Button";
import { SearchIcon, DownloadIcon } from "./icons";

interface LeadsToolbarProps {
  cidades: string[];
  termos: string[];
  statusOptions: readonly string[];
  filtroCidade: string;
  filtroStatus: string;
  filtroTermo: string;
  filtroBusca: string;
  onFiltroCidadeChange: (v: string) => void;
  onFiltroStatusChange: (v: string) => void;
  onFiltroTermoChange: (v: string) => void;
  onFiltroBuscaChange: (v: string) => void;
  onFiltrar: () => void;
  onExportar: () => void;
}

export default function LeadsToolbar({
  cidades,
  termos,
  statusOptions,
  filtroCidade,
  filtroStatus,
  filtroTermo,
  filtroBusca,
  onFiltroCidadeChange,
  onFiltroStatusChange,
  onFiltroTermoChange,
  onFiltroBuscaChange,
  onFiltrar,
  onExportar,
}: LeadsToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <select
        className={formStyles.select}
        value={filtroCidade}
        onChange={(e) => onFiltroCidadeChange(e.target.value)}
      >
        <option value="">Todas as cidades</option>
        {cidades.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        className={formStyles.select}
        value={filtroStatus}
        onChange={(e) => onFiltroStatusChange(e.target.value)}
      >
        <option value="">Todos os status</option>
        {statusOptions.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        className={formStyles.select}
        value={filtroTermo}
        onChange={(e) => onFiltroTermoChange(e.target.value)}
      >
        <option value="">Todos os termos</option>
        {termos.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <div className={styles.searchWrap}>
        <SearchIcon />
        <input
          type="text"
          className={`${formStyles.input} ${styles.searchInput}`}
          placeholder="Buscar por nome ou endereço..."
          value={filtroBusca}
          onChange={(e) => onFiltroBuscaChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onFiltrar();
          }}
        />
      </div>
      <Button variant="ghost" onClick={onFiltrar}>
        Filtrar
      </Button>
      <div className={styles.spacer} />
      <Button variant="primary" onClick={onExportar}>
        <DownloadIcon />
        Exportar .xlsx
      </Button>
    </div>
  );
}
