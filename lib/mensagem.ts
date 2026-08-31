import type { SiteQualidade } from "./types";

/**
 * Mensagens de abordagem usadas quando o projeto ainda não tem NENHUM template
 * cadastrado (primeiro uso). São sorteadas por lead — uma variação diferente
 * cada vez — e o "Regenerar" troca pra outra.
 *
 * Aceitam as mesmas variáveis {{...}} dos templates, mas de propósito só usam
 * {{nome}} (que sempre existe) pra nunca gerar frase quebrada. Personalização
 * mais forte (cidade, nota, nicho) fica pros templates que o usuário escreve.
 *
 * Objetivo da redação: primeira linha que prende, um motivo concreto pra
 * responder e uma pergunta fácil de dizer "sim" no fim.
 */

export const MENSAGENS_SEM_SITE: readonly string[] = [
  `Oi! Vi a {{nome}} no Google, cliquei pra abrir o site de vocês e não tem nenhum.

Isso pesa mais do que parece: quando alguém procura o serviço de vocês e não acha um site, quem aparece é o concorrente do lado — e a venda vai pra ele.

Eu monto site pra negócio local: no ar em poucos dias, feito pra funcionar no celular e pra aparecer na busca. Sem mensalidade cara.

Posso te mandar 2 ou 3 exemplos de sites que fiz pra negócios parecidos?`,

  `Oi, tudo bem? Uma pergunta rápida sobre a {{nome}}:

quando um cliente novo ouve falar de vocês e vai pesquisar no Google antes de ligar, o que ele encontra? Sem site, ele encontra quase nada — ou acha o concorrente.

Trabalho exatamente com isso: coloco negócios como o de vocês no Google com um site profissional, rápido e sem custo alto.

Se eu te mandar alguns exemplos, você dá uma olhada?`,

  `Oi! Achei a {{nome}} procurando negócios da região e reparei que vocês ainda não têm site.

Não vim empurrar pacote gigante. Faço site enxuto e profissional pra negócio local, no ar em poucos dias, pensado pra trazer cliente — não só pra "ficar bonito".

Quer que eu te mostre como ficaria pra vocês? Te mando exemplos e a gente conversa.`,

  `Oi, tudo bem? Falo com o responsável pela {{nome}}?

Já montei site pra vários negócios locais e o padrão se repete: quem tem uma página simples e bem feita passa mais confiança e fecha mais, principalmente com cliente que ainda não conhece.

Vocês hoje não aparecem com site nenhum. Na prática, isso é cliente indo embora sem você ver.

Faz sentido eu te mandar alguns exemplos do que consigo fazer?`,

  `Oi, tudo bem? Vi que a {{nome}} não tem site e queria te fazer uma proposta simples.

Me dá 5 minutos pra te explicar como funcionaria: site profissional, no ar rápido, feito pro celular e pra aparecer quando procurarem vocês no Google. Preço justo, sem mensalidade pesada.

Se fizer sentido, já te mando exemplos de trabalhos meus. Pode ser?`,
];

export const MENSAGENS_SITE_FRACO: readonly string[] = [
  `Oi, tudo bem? Falo com o responsável pela {{nome}}?

Dei uma olhada no site de vocês. Ele existe, mas tá jogando contra: demora pra abrir, não encaixa direito no celular e passa uma imagem mais fraca do que o negócio realmente é.

Hoje a maior parte do cliente entra pelo celular — se trava ali, ele fecha e vai pro concorrente.

Eu refaço isso: site rápido, moderno e feito pra converter. Quer ver alguns exemplos?`,

  `Oi! Entrei no site da {{nome}} e fiquei com a sensação de que ele não faz jus ao negócio.

Não é crítica, é oportunidade: um site mais rápido, limpo e fácil de usar no celular muda como o cliente enxerga vocês antes mesmo do primeiro contato.

Faço esse tipo de reformulação sem enrolação e com prazo curto. Posso te mandar um antes/depois de um projeto parecido?`,

  `Oi, tudo bem? Pega o site de vocês no seu celular agora e repara: demora, precisa dar zoom pra ler, botão difícil de achar?

É isso que o cliente de vocês sente — e site ruim no celular derruba venda sem você perceber.

Eu deixo isso redondo: rápido, bonito e fácil de usar. Quer que eu te mostre como ficaria?`,

  `Oi! Comparei o site da {{nome}} com o de alguns concorrentes e nesse ponto vocês estão perdendo: o de vocês carrega mais devagar e passa menos confiança.

Dá pra virar esse jogo rápido. Refaço o site com foco em velocidade, celular e em fazer o visitante entrar em contato.

Te mando exemplos pra você ver o nível? Sem compromisso.`,

  `Oi, tudo bem? Vi o site da {{nome}} — a base tá lá, mas dá pra deixar muito melhor: mais rápido, mais moderno e redondo no celular.

Faço esse tipo de trabalho com prazo curto e preço justo. Se eu te mandar 2 ou 3 exemplos, você dá uma olhada?`,
];

export const MENSAGENS_SITE_OK: readonly string[] = [
  `Oi, tudo bem? Falo com o responsável pela {{nome}}?

O site de vocês é bem feito — mas uma pergunta sincera: ele traz cliente? Muita empresa tem site bonito que não gera contato nenhum, porque foi feito pra "estar lá", não pra converter.

Eu trabalho justamente nisso: ajustar o site pra ele virar canal de venda (mais contato, mais WhatsApp, mais orçamento).

Posso te mostrar 2 exemplos de antes/depois?`,

  `Oi! Vi o site da {{nome}} e ele tá legal. Meu ponto é outro: vocês estão sendo achados no Google por quem procura o serviço de vocês?

Ter site é metade. A outra metade é ele aparecer na busca e puxar cliente sozinho — e é aí que eu ajudo.

Se fizer sentido, te mostro como isso funcionaria pra vocês.`,

  `Oi, tudo bem? Falo com o responsável pela {{nome}}?

O site de vocês tá num bom nível. Costumo procurar negócios assim pra uma segunda etapa: deixar ele mais rápido, atualizar o visual e reforçar os pontos que fazem o visitante entrar em contato.

Quer que eu faça uma análise rápida e gratuita do site e te mande o que dá pra melhorar?`,

  `Oi! O site da {{nome}} tá bom — não vim dizer que tá ruim.

Vim oferecer o próximo passo: ajustes que costumam aumentar bastante o número de contatos que um site já decente gera (chamada pra ação, velocidade, versão celular, formulário).

Te mando exemplos desse tipo de resultado? Sem compromisso.`,
];

/** Lista de mensagens de fallback certa pra qualidade de site do lead. */
export function mensagensFallbackPara(qualidade?: SiteQualidade | string): readonly string[] {
  if (qualidade === "fraca") return MENSAGENS_SITE_FRACO;
  if (qualidade === "ok") return MENSAGENS_SITE_OK;
  return MENSAGENS_SEM_SITE;
}

/**
 * Monta uma mensagem de fallback avulsa (só substitui {{nome}}). O caminho
 * principal — gerarMensagemParaLead — usa mensagensFallbackPara + renderizarTemplate,
 * que resolve todas as variáveis e ainda registra qual variação foi usada.
 */
export function montarMensagem(nomeEmpresa: string, qualidade?: SiteQualidade | string): string {
  const lista = mensagensFallbackPara(qualidade);
  const bruto = lista[Math.floor(Math.random() * lista.length)] ?? "";
  return bruto
    .replace(/\{\{\s*nome\s*\}\}/g, nomeEmpresa.trim() || "vocês")
    .replace(/\{\{\s*\w+\s*\}\}/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
