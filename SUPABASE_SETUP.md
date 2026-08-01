# Configuração do Supabase — Projeto Falso Magro 30D

Guia passo a passo para colocar a arquitetura Vercel + Supabase no ar.

---

## Parte 1 — Criar projeto Supabase

1. Acesse https://supabase.com e crie uma conta (ou entre na existente).
2. Clique em **New Project**.
3. Escolha a organização, dê um nome (ex: `falso-magro-30d`), defina uma senha do
   banco (guarde-a em local seguro — você não vai precisar dela no dia a dia, mas
   é bom ter caso precise conectar via `psql`) e escolha a região mais próxima
   do seu público (ex: São Paulo — `sa-east-1`).
4. Clique em **Create new project** e aguarde o provisionamento (1–2 minutos).

---

## Parte 2 — Rodar a migration SQL

1. No painel do projeto, abra **SQL Editor** (ícone de terminal na barra lateral).
2. Clique em **New query**.
3. Abra o arquivo `supabase/migrations/0001_init.sql` deste projeto, copie **todo** o conteúdo
   e cole no editor.
4. Clique em **Run**. Você deve ver "Success. No rows returned".
5. Confirme em **Table Editor** que as tabelas `access_codes`, `access_attempts`,
   `profiles`, `goals` e `checkins` foram criadas, e que **Row Level Security**
   está com o cadeado fechado (ativo) em todas elas.

---

## Parte 3 — Configurar Auth

Não é necessário criar nenhum provedor de login (Google, e-mail/senha, etc.):
o app usa **e-mails técnicos sintéticos** gerados automaticamente (um por
código de acesso) apenas para dar suporte a sessões do Supabase Auth. O cliente
nunca vê nem usa essa informação — ele só digita o código.

Ajustes recomendados em **Authentication → Settings**:

- **Email confirmations**: pode deixar desativado (os usuários técnicos já são
  criados com `email_confirm: true` pela Edge Function).
- **Site URL**: coloque a URL da sua Vercel (ex: `https://seu-projeto.vercel.app`).
- Nenhum e-mail real é enviado — não é necessário configurar SMTP para este fluxo.

---

## Parte 4 — Configurar secrets (Edge Functions)

Vá em **Project Settings → Edge Functions → Secrets** (ou use a CLI, veja Parte 6)
e configure:

| Secret | Valor | Obrigatório |
|---|---|---|
| `FM_ADMIN_ACCESS_CODE` | O código que você (administrador) vai usar para entrar no painel admin. Escolha algo forte, ex: `FM30-ADMIN-7K2Q9X4P`. | **Sim** |
| `CODE_HASH_PEPPER` | Uma string aleatória longa qualquer, usada para reforçar o hash dos códigos. Gere uma com `openssl rand -hex 32`, por exemplo. | Recomendado |

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem automaticamente dentro do
ambiente das Edge Functions — você não precisa (e não deve) configurá-los manualmente.

⚠️ **Nunca** coloque `FM_ADMIN_ACCESS_CODE` ou `SUPABASE_SERVICE_ROLE_KEY` em
nenhum arquivo do frontend (`assets/js/...` ou `index.html`). Eles vivem
exclusivamente como secret das Edge Functions.

Enquanto `FM_ADMIN_ACCESS_CODE` não estiver configurado, a função `admin-login`
recusa qualquer tentativa de login administrativo (proteção padrão).

---

## Parte 5 — Configurar a Vercel

Em **Project Settings → Environment Variables** na Vercel, você **não precisa**
de nenhuma variável de ambiente, pois o projeto é 100% estático (HTML/CSS/JS puro).

Em vez disso, preencha diretamente o arquivo público (isso é seguro, pois só
contém dados que já são públicos por natureza):

```js
// assets/js/supabase-config.js
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'SUA_CHAVE_ANON_PUBLICA_AQUI';
```

Esses dois valores estão em **Project Settings → API** no painel do Supabase
(`Project URL` e `anon public`/`publishable` key). Eles são seguros para ficar
públicos porque toda a segurança real está no RLS e nas Edge Functions —
nunca use a chave `service_role` aqui.

---

## Parte 6 — Deploy das Edge Functions

Instale a CLI do Supabase (uma vez):

```bash
npm install -g supabase
```

Faça login e vincule o projeto:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
```

(`SEU_PROJECT_REF` está na URL do painel: `https://supabase.com/dashboard/project/SEU_PROJECT_REF`)

Configure os secrets via CLI (alternativa ao painel):

```bash
supabase secrets set FM_ADMIN_ACCESS_CODE="FM30-ADMIN-7K2Q9X4P"
supabase secrets set CODE_HASH_PEPPER="$(openssl rand -hex 32)"
```

Faça o deploy de cada função:

```bash
supabase functions deploy redeem-access-code
supabase functions deploy admin-login
supabase functions deploy generate-access-code
supabase functions deploy admin-clients
```

---

## Parte 7 — Criar o primeiro acesso

1. Publique o app na Vercel (com `supabase-config.js` já preenchido).
2. Abra o app publicado.
3. Na tela de login, clique em **"Acesso admin"**.
4. Digite o mesmo valor que você colocou em `FM_ADMIN_ACCESS_CODE`.
5. Você entrará no app normalmente (Início, Check-in, Histórico, Progresso, Guia)
   e verá um item extra **⚙️ Admin** na barra lateral (desktop) e um botão
   **"⚙️ Painel administrativo"** no fim da aba Guia (mobile e desktop).
6. Abra o painel administrativo e clique em **"+ Gerar novo código"**.
7. Copie o código gerado (ele só é exibido uma vez) e envie ao seu primeiro cliente.

---

## Parte 8 — Testar

Checklist rápido (veja a lista completa de testes na entrega final da migração):

- [ ] Login com código de cliente novo → onboarding (nome) → app funcional.
- [ ] Calcular metas → fechar navegador → abrir de novo → metas continuam.
- [ ] Fazer check-in → fechar app → abrir de novo → check-in continua.
- [ ] Mesmo código em outro navegador (ex: Firefox) → mesmos dados aparecem.
- [ ] Dois códigos diferentes → cada um só vê os próprios dados.
- [ ] Código de admin → acessa painel → gera cliente → lista aparece.
- [ ] Código errado → mensagem genérica de erro, sem revelar detalhes.
- [ ] Bloquear cliente no painel admin → código para de funcionar.
- [ ] Desligar a internet → app continua abrindo com os últimos dados salvos;
      ao reconectar, o toast "Dados sincronizados com sucesso" aparece.

---

## Solução de problemas comuns

- **"Código inválido" mesmo com o código certo**: confira se `supabase-config.js`
  aponta para o projeto certo e se a migration rodou sem erros.
- **Login admin sempre falha**: confirme se `FM_ADMIN_ACCESS_CODE` foi configurado
  como secret e se a função `admin-login` foi reimplantada após configurá-lo.
- **Dados não aparecem em outro dispositivo**: verifique se as duas sessões usaram
  exatamente o mesmo código (a validação ignora maiúsculas/minúsculas, mas não
  espaços ou caracteres extras).
