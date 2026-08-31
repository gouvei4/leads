import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getLeads } from "@/lib/leads";
import { calcularScore } from "@/lib/score";
import type { Lead } from "@/lib/types";

const COLUNAS = [
  { header: "Nome", key: "nome", width: 32 },
  { header: "Telefone", key: "telefone", width: 16 },
  { header: "Cidade", key: "cidade", width: 18 },
  { header: "Endereco", key: "endereco", width: 42 },
  { header: "Site", key: "site", width: 26 },
  { header: "Link Maps", key: "link_maps", width: 14 },
  { header: "Termo da Busca", key: "termo_busca", width: 18 },
  { header: "Status", key: "status", width: 14 },
  { header: "Score", key: "score", width: 8 },
  { header: "Ultimo Contato", key: "ultimo_contato", width: 14 },
  { header: "Observacoes", key: "observacoes", width: 30 },
  { header: "Mensagem", key: "mensagem", width: 50 },
] as const;

function linhaDoLead(l: Lead) {
  return {
    nome: l.nome,
    telefone: l.telefone,
    cidade: l.cidade,
    endereco: l.endereco,
    site: l.site,
    link_maps: l.link_maps,
    termo_busca: l.termo_busca,
    status: l.status,
    score: calcularScore(l),
    ultimo_contato: l.ultimo_contato,
    observacoes: l.observacoes,
    mensagem: l.mensagem_gerada ?? "",
  };
}

function escaparCsv(valor: unknown): string {
  const texto = String(valor ?? "");
  if (/[",\n]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

function montarCsv(leads: Lead[]): string {
  const cabecalho = COLUNAS.map((c) => escaparCsv(c.header)).join(",");
  const linhas = leads.map((l) => {
    const linha = linhaDoLead(l);
    return COLUNAS.map((c) => escaparCsv(linha[c.key as keyof typeof linha])).join(",");
  });
  return ["﻿" + cabecalho, ...linhas].join("\r\n");
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const projeto = searchParams.get("projeto")?.trim() ?? "";
    const formato = searchParams.get("formato") === "csv" ? "csv" : "xlsx";
    if (!projeto) {
      return NextResponse.json({ erro: "Selecione um projeto antes de exportar." }, { status: 400 });
    }
    const leads = await getLeads(db, projeto);
    const dataFormatada = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    if (formato === "csv") {
      const csv = montarCsv(leads);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="leads_${dataFormatada}.csv"`,
        },
      });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Leads");
    sheet.columns = COLUNAS.map((c) => ({ header: c.header, key: c.key, width: c.width }));

    for (const l of leads) {
      sheet.addRow(linhaDoLead(l));
    }

    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    });

    sheet.views = [{ state: "frozen", ySplit: 1 }];
    const ultimaColuna = String.fromCharCode("A".charCodeAt(0) + COLUNAS.length - 1);
    sheet.autoFilter = { from: "A1", to: `${ultimaColuna}${leads.length + 1}` };

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="leads_${dataFormatada}.xlsx"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ erro: (err as Error).message }, { status: 500 });
  }
}
