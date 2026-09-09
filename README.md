# Prospector de Leads

Sistema para buscar empresas (Google Places), salvar no Firestore e
gerenciar o status de cada uma (Novo, Contatado, Respondeu, Negociando,
Cliente, Recusado). Não tem login próprio — é feito para uso pessoal
(dá pra travar por senha, veja `APP_PASSWORD` abaixo).

Stack: **Next.js (App Router + TypeScript)**, **Tailwind CSS v4**,
**Firebase Firestore** (via Admin SDK, só no servidor), **Leaflet** pro
mapa, deploy na **Vercel**.

## 1. Instalar

Precisa de Node.js 18+.

```bash
npm install
```

## 2. Configurar variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```bash
cp .env.local.example .env.local
```

- **`GOOGLE_PLACES_KEY`**: chave da Google Places API (New).
  1. `console.cloud.google.com` → criar projeto
  2. Ativar **Places API (New)** em APIs e Serviços → Biblioteca
  3. Credenciais → Criar credenciais → Chave de API
  4. Colar o valor em `GOOGLE_PLACES_KEY`

- **`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`**:
  credenciais da conta de serviço do Firebase Admin.
  1. No [Console do Firebase](https://console.firebase.google.com), crie
     (ou reaproveite) um projeto com **Firestore Database** ativado.
  2. Configurações do projeto → Contas de serviço → **Gerar nova chave
     privada** — baixa um `.json`.
  3. Copie `project_id`, `client_email` e `private_key` do JSON para as
     três variáveis (mantenha as quebras de linha da chave como `\n`,
     tudo em uma linha só, entre aspas).

- **`APP_PASSWORD`** (opcional, mas recomendado em produção): se
  preenchido, o site inteiro — incluindo as rotas `/api` — passa a pedir
  senha (HTTP Basic; qualquer usuário, essa senha). Vazio = sem trava,
  ok pra rodar só local. Sem isso, qualquer um com a URL da Vercel lê e
  escreve seus dados e gasta sua cota do Google.

Essas variáveis nunca devem ser commitadas — o `.env.local` já está no
`.gitignore`. Na Vercel, configure as mesmas variáveis em
**Project Settings → Environment Variables**.

A chave da Google Places fica só no arquivo de ambiente (não é editável
pela interface); depois de trocar, reinicie o servidor.

## 3. Rodar localmente

```bash
npm run dev
```

Abra **http://localhost:3000**.

## 4. Deploy (Vercel)

```bash
npx vercel
```

Ou conecte o repositório pelo painel da Vercel. Configure as variáveis de
ambiente no projeto da Vercel (`GOOGLE_PLACES_KEY`, `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` e, de preferência,
`APP_PASSWORD`).

> A busca enriquece cada resultado (baixa a home do site pra classificar
> qualidade e achar Instagram/e-mail), então tem um teto de tempo. Raios
> muito grandes com muitos resultados podem passar do limite da função
> serverless — se acontecer, reduza o raio.

## 5. Usar

A tela é única: uma barra fina de ícones à esquerda troca entre
**Prospecção**, **Templates**, **Blacklist** e **Configurações**.

- **Projeto** (topo da sidebar, na Prospecção): cada projeto é uma
  prospecção separada — "Caçambas" e "Elétrica" não se misturam. Leads,
  busca e exportação ficam sempre dentro do projeto selecionado. `+` cria,
  o lápis renomeia, a lixeira exclui (excluir um projeto não apaga os
  leads dele, só os deixa sem projeto).
- **Buscar** (sidebar): informe o **nicho**, escolha a **localização**
  pelo autocomplete e o **raio**. A busca roda no Google Places, filtra
  pela distância real do centro, enriquece cada resultado e salva no
  projeto atual — sem duplicar (dedupe por `place_id` do Google, ou por
  nome + endereço em imports antigos).
- **Mapa / Kanban / Painel** (sidebar): três formas de ver os mesmos
  leads. Mapa mostra os pins por status; Kanban permite arrastar entre
  status; Painel traz funil, conversão e desempenho por nicho/cidade/
  template.
- **Lead**: clique num card pra abrir o detalhe — mensagem gerada (copiar
  / WhatsApp / regenerar / editar), status, último contato, follow-up,
  tags, observações, dados de CNPJ e histórico.
- **Atalhos de teclado**: `?` abre a lista (`j`/`k` navegam, `c` copia,
  `1`–`6` mudam status, `/` foca a busca).
- **Exportar** (sidebar): baixa a lista do projeto atual em `.xlsx` ou
  `.csv`.

## Onde ficam os dados

Tudo no **Firestore** (coleções `leads`, `projetos`, `templates`,
`buscas`, `blacklist`, `config`). Backup é responsabilidade do Firebase
— ou exporte pra `.xlsx` de vez em quando.

## Importar planilhas antigas (CSV/XLSX)

Pra trazer listas antigas (colunas como
`nome,telefone,endereco,site,link_maps,busca` ou o export
`Nome,Telefone,Cidade,Endereco,Site,Link Maps,Termo da
Busca,Status,Ultimo Contato,Observacoes`):

```bash
npm run import-leads -- leads_cacambas.csv "Cacambas"
npm run import-leads -- lista.xlsx "Nome do projeto"
```

O segundo argumento é o projeto de destino — criado automaticamente se
não existir. Não duplica quem já existe no mesmo projeto (nome +
endereço); se a planilha trouxer Status/Observações/Último contato
preenchidos pra alguém que já existe, esses campos são atualizados.

## Dúvidas comuns

- **Erro 403 ao buscar**: a Places API (New) não tá ativada no projeto
  do Google Cloud, ou a chave tá restrita à API errada.
- **Erro sobre billing**: faturamento não ativado no Google Cloud
  (precisa cadastrar cartão, mas o crédito gratuito mensal cobre uso
  normal de prospecção).
- **"Firebase Admin não configurado"**: falta preencher `FIREBASE_*`
  no `.env.local` (ou nas variáveis de ambiente da Vercel).
- **A versão antiga (Flask + SQLite)** foi removida do repositório; se
  precisar, está no histórico do git antes deste commit.
