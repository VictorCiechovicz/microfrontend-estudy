# Ícones em múltiplos formatos (`icon.png` + `icon.svg`)

## O que é

Arquivos `icon.png`, `icon.svg` etc. na raiz de `app/` são convenção de metadados: o Next gera um `<link rel="icon">` para cada um, com `type` e `sizes` inferidos. Com mais de um arquivo, todos entram no `<head>` e o navegador escolhe.

## Versão

A convenção é antiga; o suporte a vários formatos lado a lado é o que o spec lista para a 16.2. Lab em 16.4.3 (a doc instalada de `app-icons` não traz mais detalhes de versão).

## Onde no código

`apps/shell/app/icon.png` (32x32) e `apps/shell/app/icon.svg`. A home do shell também exporta `ensureStatic = 'navigation'` (ver `ensure-static.md`), então os ícones saem junto com a página estática.

## Como observar

`curl -s localhost:3000/ | grep -o '<link rel="icon"[^>]*>'` mostra os dois `<link>`; cada `href` responde 200 com `content-type` de imagem. O e2e `e2e/shell.spec.ts` confere o mesmo.
