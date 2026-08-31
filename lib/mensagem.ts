const MENSAGEM_SEM_SITE = `Oi, tudo bem? Falo com o responsável pela __EMPRESA__?

Passei pelo Google e vi que vocês ainda não têm um site — hoje isso custa cliente pra concorrência que aparece primeiro na busca.

Eu crio sites profissionais, rápidos e prontos pra celular, com prazo curto e preço justo pra quem tá começando essa etapa.

Faz sentido eu te mandar alguns exemplos?`;

const MENSAGEM_SITE_FRACO = `Oi, tudo bem? Falo com o responsável pela __EMPRESA__?

Dei uma olhada no site de vocês e acho que dá pra melhorar bastante — hoje ele pode estar afastando cliente em vez de trazer.

Eu crio sites profissionais, rápidos e prontos pra celular. Faz sentido eu te mandar alguns exemplos do que consigo fazer?`;

export function montarMensagem(nomeEmpresa: string, siteFraco = false): string {
  const template = siteFraco ? MENSAGEM_SITE_FRACO : MENSAGEM_SEM_SITE;
  return template.replace("__EMPRESA__", nomeEmpresa);
}
