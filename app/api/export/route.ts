import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebaseAdmin";
import { getLeads } from "@/lib/leads";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const projeto = new URL(request.url).searchParams.get("projeto")?.trim() ?? "";
    const leads = await getLeads(db, projeto || undefined);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Leads");

    sheet.columns = [
      { header: "Nome", key: "nome", width: 32 },
      { header: "Telefone", key: "telefone", width: 16 },
      { header: "Cidade", key: "cidade", width: 18 },
      { header: "Endereco", key: "endereco", width: 42 },
      { header: "Site", key: "site", width: 26 },
      { header: "Link Maps", key: "link_maps", width: 14 },
      { header: "Termo da Busca", key: "termo_busca", width: 18 },
      { header: "Status", key: "status", width: 14 },
      { header: "Ultimo Contato", key: "ultimo_contato", width: 14 },
      { header: "Observacoes", key: "observacoes", width: 30 },
    ];

    for (const l of leads) {
      sheet.addRow({
        nome: l.nome,
        telefone: l.telefone,
        cidade: l.cidade,
        endereco: l.endereco,
        site: l.site,
        link_maps: l.link_maps,
        termo_busca: l.termo_busca,
        status: l.status,
        ultimo_contato: l.ultimo_contato,
        observacoes: l.observacoes,
      });
    }

    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    });

    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = { from: "A1", to: `J${leads.length + 1}` };

    const buffer = await workbook.xlsx.writeBuffer();
    const dataFormatada = new Date().toISOString().slice(0, 10).replace(/-/g, "");

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
