# Projeto Falso Magro — 30 Dias

Aplicação web (HTML + CSS + JS puro, sem frameworks) para o desafio de 30 dias.

**Arquitetura atual:** Vercel (hospedagem estática) + Supabase (Auth + PostgreSQL + Edge Functions).
Cada cliente acessa com um **código individual** (não existe mais senha universal).
Os dados são salvos oficialmente no Supabase e usam o LocalStorage apenas como
cache local / fallback offline.

👉 Para configurar o Supabase do zero (banco, Auth, secrets, Edge Functions),
siga o guia completo em **[`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)**.

## Estrutura de arquivos

```
index.html
vercel.json
manifest.json
service-worker.js

assets/
  css/style.css
  js/
    supabase-config.js  → SUPABASE_URL e chave pública (não contém secrets)
    supabase-client.js  → único arquivo que fala com o Supabase (client + Edge Functions)
    auth.js              → orquestra login por código (client e admin)
    storage.js            → camada híbrida: Supabase (fonte oficial) + LocalStorage (cache)
    calculator.js         → cálculo de TMB, GET, calorias e macros
    dashboard.js           → tela inicial (saudação, checklist de passos)
    checkin.js              → check-in diário
    progress.js              → progresso, metas e histórico
    admin.js                  → painel administrativo (gerar/gerenciar códigos)
    app.js                     → navegação, autenticação, inicialização
  icons/                        → ícones do PWA

pdf/guia.pdf                     → guia completo (substitua pelo seu arquivo real)

supabase/
  migrations/0001_init.sql       → schema completo (rode no SQL Editor do Supabase)
  functions/                     → Edge Functions (redeem-access-code, admin-login,
                                    generate-access-code, admin-clients)
```

## Como publicar na Vercel

1. Configure o Supabase primeiro — veja `SUPABASE_SETUP.md`.
2. Preencha `assets/js/supabase-config.js` com a URL e a chave pública (anon) do seu projeto Supabase.
3. Crie uma conta gratuita em vercel.com → **Add New → Project** → **Deploy without Git** → arraste a pasta do projeto → Deploy. Nenhuma configuração de build é necessária (site 100% estático).

## Como gerar o primeiro código de cliente

Depois de configurar o Supabase e publicar o app, entre com o código de administrador
(botão "Acesso admin" na tela de login) e use o botão **+ Gerar novo código** dentro
do Painel Administrativo. Veja o passo a passo completo em `SUPABASE_SETUP.md`.

## Como substituir o PDF do guia

Coloque seu arquivo de guia definitivo em `pdf/guia.pdf` (mesmo nome), substituindo o de exemplo.

## Como personalizar textos, cores e logotipo

**Textos:** direto no `index.html`.
**Cores:** centralizadas no topo de `assets/css/style.css`, bloco `:root` (ex: `--orange: #FF6A00;`).
**Ícone do app instalado:** troque `assets/icons/icon-192.png` e `icon-512.png` por imagens quadradas do mesmo tamanho.

## Sobre a persistência de dados

O Supabase é a fonte oficial dos dados (protegida por Row Level Security — cada
cliente só acessa os próprios dados). O LocalStorage funciona como cache: garante
que o app abra instantaneamente e continue utilizável mesmo sem internet, sincronizando
automaticamente assim que a conexão voltar.
