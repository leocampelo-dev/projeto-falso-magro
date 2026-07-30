# Projeto Falso Magro — 30 Dias

Aplicação web (HTML + CSS + JS puro, sem frameworks e sem backend) para o desafio de 30 dias.
Todos os dados ficam salvos no LocalStorage do próprio navegador do usuário.

## Estrutura de arquivos

```
index.html
vercel.json
manifest.json
service-worker.js
assets/
  css/style.css
  js/auth.js         → controle de senha de acesso
  js/storage.js       → toda a leitura/escrita no LocalStorage
  js/calculator.js    → cálculo de TMB, GET, calorias e macros
  js/dashboard.js      → tela inicial (saudação, dia do desafio, metas)
  js/checkin.js        → formulário de check-in diário
  js/progress.js       → progresso (barra + grade de 30 dias) e histórico
  js/app.js            → navegação, toasts, modal da calculadora, inicialização
  icons/               → ícones do PWA
pdf/guia.pdf            → guia completo (substitua pelo seu arquivo real)
```

## Como publicar na Vercel

1. Crie uma conta gratuita em https://vercel.com (pode entrar com GitHub, GitLab ou e-mail).
2. Clique em **Add New → Project**.
3. Escolha **"Deploy without Git"** (ou suba os arquivos para um repositório no GitHub e importe o repositório).
4. Se for enviar os arquivos diretamente, arraste a pasta completa do projeto (mantendo a estrutura acima) para a área de upload.
5. Não é necessário configurar Build Command nem Output Directory — é um site 100% estático. Deixe os campos em branco/padrão.
6. Clique em **Deploy**. Em menos de um minuto sua aplicação estará no ar com uma URL gratuita (ex: `seu-projeto.vercel.app`).
7. Se quiser um domínio próprio, adicione em **Project Settings → Domains**.

## Como alterar a senha de acesso

Abra o arquivo `assets/js/auth.js` e altere esta linha:

```js
const APP_PASSWORD = 'FALSOMAGRO30';
```

Troque `FALSOMAGRO30` pela senha que você quiser entregar aos seus clientes. Salve o arquivo e publique novamente na Vercel.

## Como substituir o PDF do guia

1. Coloque seu arquivo de guia definitivo na pasta `pdf/`.
2. Renomeie-o para `guia.pdf` (substituindo o arquivo de exemplo) — ou, se preferir manter outro nome, ajuste a linha abaixo no arquivo `assets/js/app.js`:

```js
window.open('pdf/guia.pdf', '_blank', 'noopener');
```

## Como personalizar textos, cores e logotipo

**Textos:** todos os textos ficam diretamente no `index.html`, escritos em português simples — basta editar o conteúdo entre as tags.

**Cores:** todas as cores da aplicação estão centralizadas no topo do arquivo `assets/css/style.css`, dentro do bloco `:root`. Por exemplo:

```css
--orange: #FF6A00;   → cor principal da marca
--black: #0D0D0D;    → fundo escuro / textos
```

Altere os valores hexadecimais para trocar a identidade visual em todo o app de uma vez.

**Logotipo/ícone:** o emoji 🔥 é usado como marca dentro do app (splash, telas de login e cabeçalho da barra lateral) — basta trocar o emoji diretamente no `index.html` se quiser outro símbolo. Já os ícones do PWA (usados quando o usuário instala o app no celular) ficam em `assets/icons/icon-192.png` e `assets/icons/icon-512.png`; substitua esses arquivos por imagens quadradas nos mesmos tamanhos para trocar o ícone do aplicativo instalado.

## Sobre a persistência de dados

Como não há backend nem banco de dados, tudo é salvo com `localStorage` no navegador do próprio usuário. Isso significa que os dados:

- Ficam somente naquele navegador/dispositivo.
- São perdidos se o usuário limpar os dados do site ou trocar de aparelho.

Essas informações já são explicadas para o usuário dentro do próprio app, na seção **Guia → Leia antes de começar**.
