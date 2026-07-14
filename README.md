# Prospector de Leads

Sistema para buscar empresas (Google Places), salvar no Firestore e
gerenciar o status de cada uma (Novo, Contatado, Respondeu, Negociando,
Cliente, Sem interesse). Não tem login — é feito para uso pessoal.

Stack: **Next.js (App Router + TypeScript)**, **CSS Modules**,
**Firebase Firestore** (via Admin SDK, só no servidor), deploy na
**Vercel**.

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

Ou conecte o repositório pelo painel da Vercel. Lembre de configurar as
4 variáveis de ambiente (`GOOGLE_PLACES_KEY`, `FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) no projeto da Vercel.

> Buscas muito grandes (muitas combinações de termo × cidade) podem
> passar do tempo máximo de uma função serverless. Prefira rodar em
> lotes menores (poucas dezenas de combinações por vez).

## 5. Usar

- **Projetos**: no topo da tela (abaixo do cabeçalho) tem um seletor de
  projeto. Cada projeto é uma prospecção separada — por exemplo,
  "Caçambas" e "Elétrica" não se misturam: leads, busca e exportação
  ficam sempre dentro do projeto selecionado. Crie um projeto novo pelo
  `+`, renomeie pelo lápis, ou exclua pela lixeira (excluir um projeto
  não apaga os leads dele, só os deixa sem projeto).
- **Aba Buscar**: cole os termos (um por linha) e as cidades (uma por
  linha). Clica em Iniciar busca — roda todas as combinações e salva
  tudo no Firestore **dentro do projeto selecionado**, sem duplicar
  quem já existe nesse mesmo projeto (dedupe por projeto + nome +
  endereço — a mesma empresa pode aparecer em projetos diferentes).
- **Aba Leads**: lista do projeto atual. Filtra por cidade/status/termo,
  muda o status de cada empresa num clique, anota observações e data do
  último contato direto na tabela.
- **Exportar .xlsx**: baixa a lista do projeto atual (respeitando os
  filtros) em Excel formatado.

## Onde ficam os dados

Tudo fica no **Firestore** (coleção `leads`), não mais num arquivo
local. Backup é responsabilidade do Firebase (ou exporte para `.xlsx`
periodicamente).

## Importar planilhas antigas (CSV/XLSX)

Se você tem arquivos `.csv` ou `.xlsx` de listas antigas (formato do
app Flask, com colunas como `nome,telefone,endereco,site,link_maps,busca`
ou o export `Nome,Telefone,Cidade,Endereco,Site,Link Maps,Termo da
Busca,Status,Ultimo Contato,Observacoes`), importe direto pro Firestore:

```bash
npm run import-leads -- leads_cacambas.csv "Cacambas"
npm run import-leads -- leads_20260707.xlsx "Nome do projeto"
```

O segundo argumento é o projeto de destino — se não existir, é criado
automaticamente. Não duplica quem já existir no mesmo projeto (mesmo
nome + endereço) — se a planilha trouxer Status/Observações/Último
contato preenchidos pra alguém que já existe, esses campos são
atualizados; senão, o lead existente é ignorado sem mudanças.

## Sobre a versão anterior (Flask)

A versão antiga (Flask + SQLite) foi movida para `legacy-flask/`, só
como referência — não é mais mantida. Os arquivos `leads.db`,
`leads_cacambas.csv` e `leads_20260707.xlsx` na raiz são os dados que
você já tinha coletado antes da migração.

## Dúvidas comuns

- **Erro 403 ao buscar**: a Places API (New) não tá ativada no projeto
  do Google Cloud, ou a chave tá restrita à API errada.
- **Erro sobre billing**: faturamento não ativado no Google Cloud
  (precisa cadastrar cartão, mas o crédito gratuito mensal cobre uso
  normal de prospecção).
- **"Firebase Admin não configurado"**: falta preencher `FIREBASE_*`
  no `.env.local` (ou nas variáveis de ambiente da Vercel).
