# Prospector de Leads

Sistema para buscar empresas (Google Places), salvar no Firestore e
gerenciar o status de cada uma (Novo, Contatado, Respondeu, Negociando,
Cliente, Recusado).

O acesso é **por token**: você (admin) gera um token no painel `/admin`,
envia pra pessoa, e ela entra em `/login` com esse token. Cada token é um
**workspace isolado** — o cliente só vê os próprios leads. O token vale
**30 dias**; quando expira, os dados de trabalho daquele cliente são
apagados automaticamente (o cadastro dele fica no painel, marcado como
"Expirado").

Stack: **Next.js 16 (App Router + TypeScript)**, **Tailwind CSS v4**,
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

- **`AUTH_SECRET`** (obrigatório): segredo pra assinar os cookies de
  sessão. Sem ele o app fica travado (todo acesso cai em `/login` com
  erro de configuração). Gere um:

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- **`CRON_SECRET`** (obrigatório em produção): protege o endpoint de
  limpeza automática. O Vercel Cron manda `Authorization: Bearer
  <CRON_SECRET>` nas chamadas. Gere igual ao `AUTH_SECRET`.

Essas variáveis nunca devem ser commitadas — o `.env.local` já está no
`.gitignore`. Na Vercel, configure todas em **Project Settings →
Environment Variables** (inclusive `AUTH_SECRET` e `CRON_SECRET`).

## 3. Criar o primeiro admin

O login do painel `/admin` é um usuário na coleção `admins` do Firestore.
Crie o primeiro (ou troque a senha de um existente):

```bash
npm run criar-admin -- voce@exemplo.com "uma-senha-forte"
```

## 4. Rodar localmente

```bash
npm run dev
```

Abra **http://localhost:3000**. Sem sessão, você cai em `/login`.
Vá em **/admin**, entre com o admin criado, gere um token e use esse
token no `/login`.

## 5. Deploy (Vercel)

```bash
npx vercel
```

Ou conecte o repositório pelo painel da Vercel. Configure as variáveis de
ambiente (`GOOGLE_PLACES_KEY`, `FIREBASE_*`, `AUTH_SECRET`, `CRON_SECRET`).
O `vercel.json` já agenda a limpeza automática (`/api/cron/limpar-expirados`,
1x/dia às 4h UTC).

As consultas por projeto usam os índices descritos em `firestore.indexes.json`.
Antes do primeiro deploy desta versão, publique-os uma vez no projeto Firebase:

```bash
npx firebase-tools deploy --only firestore:indexes
```

> A busca enriquece cada resultado (baixa a home do site pra classificar
> qualidade e achar Instagram/e-mail), então tem um teto de tempo. Raios
> muito grandes com muitos resultados podem passar do limite da função
> serverless — se acontecer, reduza o raio.

## 6. Acesso por token — como funciona

**Gerar** (painel `/admin`): preencha nome do cliente (obrigatório),
e-mail, WhatsApp, empresa e observações internas. O sistema cria um token
único, calcula a expiração (criado + 30 dias) e mostra o token puro
**uma única vez** — copie e envie pra pessoa.

**Entrar** (`/login`): a pessoa cola o token. O servidor confere se ele
existe, não foi revogado e está dentro dos 30 dias. Se estiver ok, grava
um cookie de sessão assinado (HttpOnly) que dura até a data de expiração
do token — a pessoa não redigita o token a cada refresh.

**Validação contínua**: o `proxy.ts` (roda no servidor, antes de toda
página e toda rota `/api`) confere a assinatura do cookie **e** consulta
o Firestore pra ver se o token continua ativo (cache de ~60s). Revogar ou
expirar passa a valer em no máximo 1 minuto, mesmo pra quem já está
logado. Nada é validado só no frontend.

**Segurança do token**: no banco fica só o SHA-256 do token (nunca o
valor puro) + os 6 primeiros caracteres, pra você identificar na lista.

**Gerenciar** (`/admin`): a tabela mostra cada acesso com data de
criação, expiração, status (Ativo / Expirado / Revogado) e último acesso.

- **Revogar**: bloqueia o acesso na hora; os dados ficam até o token
  expirar (aí a limpeza automática apaga).
- **Excluir**: bloqueia o acesso **e** apaga todos os dados do cliente
  imediatamente, mais o cadastro dele.

**Limpeza automática**: `/api/cron/limpar-expirados` (Vercel Cron, 1x/dia)
apaga `leads`, `projetos`, `templates`, `buscas`, `blacklist` e o perfil
de todo cliente que passou dos 30 dias, e marca o cadastro com
`dados_apagados_em`. Pra rodar na mão:

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" \
  https://SEU-APP.vercel.app/api/cron/limpar-expirados
```

## 7. Usar

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

Tudo no **Firestore**:

- Por cliente (têm o campo `dono` = id do doc em `clientes`): `leads`,
  `projetos`, `templates`, `buscas`, `blacklist`; o perfil fica em
  `perfis/{donoId}`.
- Controle de acesso: `clientes` (um por token), `admins` (login do
  painel).

Backup é responsabilidade do Firebase — ou exporte pra `.xlsx` de vez em
quando.

## Scripts

- `npm run criar-admin -- email senha` — cria/atualiza um admin.
- `npm run reset-dados -- --apply` — apaga **todos** os dados de trabalho
  (`leads`, `projetos`, `templates`, `buscas`, `blacklist`, `perfis`).
  Não toca em `clientes` nem `admins`. Roda em dry-run sem `--apply`.
- `npm run import-leads -- arquivo.csv CLIENTE_ID "Nome do Projeto"` —
  importa CSV/XLSX para o workspace de um cliente. O `CLIENTE_ID` é o ID do
  documento na coleção `clientes`; o projeto é criado caso ainda não exista.
- `npm run migrate-status` — migra status de dados legados em modo dry-run;
  acrescente `--apply` para efetivar.

## Dúvidas comuns

- **Cai sempre em `/login` com "sistema não configurado"**: falta
  `AUTH_SECRET` nas variáveis de ambiente.
- **Erro 403 ao buscar**: a Places API (New) não tá ativada no projeto
  do Google Cloud, ou a chave tá restrita à API errada.
- **Erro sobre billing**: faturamento não ativado no Google Cloud
  (precisa cadastrar cartão, mas o crédito gratuito mensal cobre uso
  normal de prospecção).
- **"Firebase Admin não configurado"**: falta preencher `FIREBASE_*`
  no `.env.local` (ou nas variáveis de ambiente da Vercel).
