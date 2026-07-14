"use client";

import styles from "./ProjectSwitcher.module.css";
import formStyles from "./form.module.css";
import { PlusIcon, PencilIcon, TrashIcon } from "./icons";
import type { Projeto } from "@/lib/types";

interface ProjectSwitcherProps {
  projetos: Projeto[];
  projetoId: string;
  carregando: boolean;
  onSelecionar: (id: string) => void;
  onCriar: (nome: string) => void;
  onRenomear: (id: string, nome: string) => void;
  onExcluir: (id: string) => void;
}

export default function ProjectSwitcher({
  projetos,
  projetoId,
  carregando,
  onSelecionar,
  onCriar,
  onRenomear,
  onExcluir,
}: ProjectSwitcherProps) {
  const atual = projetos.find((p) => p.id === projetoId);

  function criar() {
    const nome = window.prompt("Nome do novo projeto:")?.trim();
    if (nome) onCriar(nome);
  }

  function renomear() {
    if (!atual) return;
    const nome = window.prompt("Novo nome do projeto:", atual.nome)?.trim();
    if (nome && nome !== atual.nome) onRenomear(atual.id, nome);
  }

  function excluir() {
    if (!atual) return;
    if (!confirm(`Excluir o projeto "${atual.nome}"? Os leads dele ficam sem projeto, mas não são apagados.`)) return;
    onExcluir(atual.id);
  }

  if (carregando) return <div className={styles.bar} />;

  return (
    <div className={styles.bar}>
      <span className={styles.label}>Projeto</span>
      {projetos.length > 0 ? (
        <>
          <select
            className={`${formStyles.select} ${styles.select}`}
            value={projetoId}
            onChange={(e) => onSelecionar(e.target.value)}
          >
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <button type="button" className={styles.iconBtn} onClick={renomear} title="Renomear projeto">
            <PencilIcon />
          </button>
          <button type="button" className={styles.iconBtn} onClick={excluir} title="Excluir projeto">
            <TrashIcon />
          </button>
        </>
      ) : (
        <span className={styles.empty}>Nenhum projeto ainda</span>
      )}
      <button type="button" className={styles.iconBtn} onClick={criar} title="Novo projeto">
        <PlusIcon />
      </button>
    </div>
  );
}
