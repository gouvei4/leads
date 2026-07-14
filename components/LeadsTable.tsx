"use client";

import { useState } from "react";
import styles from "./LeadsTable.module.css";
import formStyles from "./form.module.css";
import { avatarColor, initials } from "@/lib/avatar";
import { montarMensagem } from "@/lib/mensagem";
import { GlobeIcon, MapPinIcon, TrashIcon, CopyIcon, CheckIcon } from "./icons";
import type { Lead } from "@/lib/types";

interface LeadsTableProps {
  leads: Lead[];
  statusOptions: readonly string[];
  onUpdateLead: (id: string, campo: "status" | "ultimo_contato" | "observacoes", valor: string) => void;
  onDeleteLead: (id: string) => void;
}

export default function LeadsTable({ leads, statusOptions, onUpdateLead, onDeleteLead }: LeadsTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copiarMensagem(lead: Lead) {
    const texto = montarMensagem(lead.nome);
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      alert(`Não foi possível copiar automaticamente. Copie manualmente:\n\n${texto}`);
      return;
    }
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId((prev) => (prev === lead.id ? null : prev)), 1400);
  }

  function excluir(id: string) {
    if (!confirm("Excluir este lead da lista?")) return;
    onDeleteLead(id);
  }

  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <colgroup>
          <col className={styles.colNome} />
          <col className={styles.colTelefone} />
          <col className={styles.colCidade} />
          <col className={styles.colEndereco} />
          <col className={styles.colLinks} />
          <col className={styles.colTermo} />
          <col className={styles.colStatus} />
          <col className={styles.colContato} />
          <col className={styles.colObs} />
          <col className={styles.colAcao} />
        </colgroup>
        <thead className={styles.thead}>
          <tr>
            <th className={styles.th}>Nome</th>
            <th className={styles.th}>Telefone</th>
            <th className={styles.th}>Cidade</th>
            <th className={styles.th}>Endereço</th>
            <th className={styles.th}>Links</th>
            <th className={styles.th}>Termo</th>
            <th className={styles.th}>Status</th>
            <th className={styles.th}>Último contato</th>
            <th className={styles.th}>Observações</th>
            <th className={styles.th}></th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className={styles.row}>
              <td className={styles.td}>
                <div className={styles.nomeCell}>
                  <div className={styles.avatar} style={{ background: avatarColor(l.nome) }}>
                    {initials(l.nome)}
                  </div>
                  <span className={styles.nomeTxt}>{l.nome}</span>
                </div>
              </td>
              <td className={`${styles.td} ${styles.mono}`}>{l.telefone || ""}</td>
              <td className={styles.td}>{l.cidade || ""}</td>
              <td className={`${styles.td} ${styles.endereco}`}>{l.endereco || ""}</td>
              <td className={styles.td}>
                <div className={styles.links}>
                  {l.site && (
                    <a className={styles.iconLink} href={l.site} target="_blank" rel="noreferrer" title="Site">
                      <GlobeIcon />
                    </a>
                  )}
                  {l.link_maps && (
                    <a
                      className={styles.iconLink}
                      href={l.link_maps}
                      target="_blank"
                      rel="noreferrer"
                      title="Google Maps"
                    >
                      <MapPinIcon />
                    </a>
                  )}
                </div>
              </td>
              <td className={styles.td}>
                <span className={styles.termoTxt} title={l.termo_busca || ""}>
                  {l.termo_busca || ""}
                </span>
              </td>
              <td className={styles.td}>
                <select
                  className={styles.statusSelect}
                  data-status={l.status}
                  value={l.status}
                  onChange={(e) => onUpdateLead(l.id, "status", e.target.value)}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className={styles.td}>
                <input
                  type="date"
                  className={`${formStyles.input} ${styles.dateInput}`}
                  value={l.ultimo_contato || ""}
                  onChange={(e) => onUpdateLead(l.id, "ultimo_contato", e.target.value)}
                />
              </td>
              <td className={styles.td}>
                <input
                  type="text"
                  className={`${formStyles.input} ${styles.obsInput}`}
                  defaultValue={l.observacoes || ""}
                  placeholder="anotação..."
                  onBlur={(e) => onUpdateLead(l.id, "observacoes", e.target.value)}
                />
              </td>
              <td className={styles.td}>
                <div className={styles.rowAcoes}>
                  <button
                    type="button"
                    className={`${styles.copyBtn} ${copiedId === l.id ? styles.copied : ""}`}
                    onClick={() => copiarMensagem(l)}
                    title="Copiar mensagem de prospecção"
                  >
                    {copiedId === l.id ? <CheckIcon /> : <CopyIcon />}
                  </button>
                  <button type="button" className={styles.delBtn} onClick={() => excluir(l.id)} title="Excluir">
                    <TrashIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
