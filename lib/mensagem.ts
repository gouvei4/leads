const MENSAGEM_TEMPLATE = `Oi, tudo bem? Falo com o responsável pela __EMPRESA__?

Me chamo Afonso, da MS Manutenções. Atendemos quem trabalha com caçamba e roll on/polli em tudo:

✅ Reforma de caçamba (solda, chapa, pintura)
✅ Manutenção de equipamento roll on/polli
✅ Venda de equipamento (novo e usado)
✅ Venda de caçamba (nova e usada)

Como tá a frota de vocês hoje — tem algo precisando de reparo ou pensando em ampliar?`;

export function montarMensagem(nomeEmpresa: string): string {
  return MENSAGEM_TEMPLATE.replace("__EMPRESA__", nomeEmpresa);
}
