# Prospector de Leads

Sistema local pra buscar empresas (Google Places), salvar num banco e
gerenciar o status de cada uma (Novo, Contatado, Respondeu, Negociando,
Cliente, Sem interesse). Roda na sua máquina, os dados ficam só com você.

## 1. Instalar

Precisa de Python 3.9+. No terminal, dentro da pasta `leads_app`:

```bash
pip install -r requirements.txt
```

## 2. Rodar

```bash
python app.py
```

Abra **http://localhost:5000** no navegador. Deixe o terminal aberto
enquanto usa o sistema — é o "motor" rodando por trás.

## 3. Configurar a chave da API

Na aba **Configurações**, cole sua chave da Google Places API (New).
Se você já tinha uma chave do script antigo, é a mesma — cole aí.

Não tem chave ainda? Passo a passo:
1. `console.cloud.google.com` → criar projeto
2. Ativar **Places API (New)** em APIs e Serviços → Biblioteca
3. Credenciais → Criar credenciais → Chave de API
4. Copiar e colar na aba Configurações do sistema

## 4. Importar os leads que você já tinha (opcional)

Se você já tem um `leads_cacambas.csv` (do script antigo) ou uma
planilha `.xlsx` (como o CRM que geramos antes), importe pra dentro
do sistema sem perder nada. Funciona com os dois formatos:

```bash
python import_leads.py leads_cacambas.csv
python import_leads.py leads_cacambas_CRM.xlsx
```

Se a empresa já existir no sistema (mesmo nome + endereço), ele **não
duplica** — em vez disso, atualiza o Status, Observações e Último
Contato com o que estiver na planilha. Ou seja, pode reimportar depois
de editar a planilha à vontade que ele sincroniza sem bagunçar nada.

## 5. Usar

- **Aba Buscar**: cole os termos (um por linha — pode ser "aluguel de
  cacamba", "reciclagem de sucata", "ferro velho", "cooperativa de
  reciclagem", qualquer tipo de empresa) e as cidades (uma por linha).
  Clica em Iniciar busca. Ele roda todas as combinações e salva tudo,
  sem duplicar quem já existe na lista.
- **Aba Leads**: sua lista completa. Filtra por cidade/status/termo,
  muda o status de cada empresa num clique (fica colorido), anota
  observações e data do último contato direto na tabela.
- **Exportar .xlsx**: baixa a lista atual (respeitando os filtros) em
  Excel, formatada, pra quem preferir trabalhar na planilha também.

## Onde ficam os dados

Tudo fica no arquivo `leads.db` (SQLite) dentro dessa mesma pasta.
Faça backup dele de vez em quando (é só copiar o arquivo) — se apagar,
perde a lista.

## Dúvidas comuns

- **Erro 403 ao buscar**: a Places API (New) não tá ativada no projeto
  do Google Cloud, ou a chave tá restrita à API errada.
- **Erro sobre billing**: faturamento não ativado no Google Cloud
  (precisa cadastrar cartão, mas o crédito gratuito mensal cobre uso
  normal de prospecção).
- **Quero rodar em outro computador**: copia a pasta inteira
  (incluindo `leads.db` e `config.json`) pro outro PC e roda de novo.
