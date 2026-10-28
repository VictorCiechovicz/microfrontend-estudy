# `ensureStatic` (contrato de rota estática)

## O que é

`export const ensureStatic = '<etapa>'` num layout ou página declara que a rota precisa sair estática até a etapa indicada. Com `'navigation'` o build falha se qualquer dado por requisição (`cookies()`, `headers()`, `connection()`, fetch sem cache) vazar para a renderização.

## Versão

Desde 16.4.0. Lab em 16.4.3.

## Onde no código

- `apps/shell/app/page.tsx` exporta `ensureStatic = 'navigation'`: a home do shell (`/`) é totalmente estática. `e2e/shell.spec.ts` confere que `/` responde com `x-nextjs-prerender` (o Next 16.4.3 envia o header duas vezes, o Playwright o junta como `1, 1`) e que o `<head>` tem os dois `<link rel="icon">` (png 32x32 e svg, de `apps/shell/app/icon.png` e `icon.svg`), e que cada href responde 200 com `content-type` de imagem. Esse e2e não prova o `ensureStatic`: a home já saía estática antes dele. A evidência é o registro manual do build quebrando, abaixo.
- `apps/catalog/app/catalog/[lang]/layout.tsx` exporta `ensureStatic = 'prefetch'`: o App Shell e o prefetch por link das rotas do catálogo têm de ser estáticos. Os valores `'shell'` e `'prefetch'` não acrescentam validação de build; só `'navigation'` valida (ver `cache-components.md`).

## Verificação manual: o que o build diz quando a home deixa de ser estática

Foi adicionado `const session = (await cookies()).get('session')` à home do shell e rodado `pnpm --filter shell build`. A mudança foi desfeita depois. Saída real:

```
Error: Route "/": Next.js encountered uncached or runtime data on a route that must be fully static.

This route is configured to be fully static, but some data requires rendering at request time.

Ways to fix this:
  - [cache] For uncached data (`fetch`, database calls): cache the access with `"use cache"` (does not apply to `connection()`)
  - [remove] Remove the data access
  - [client] Read the data on the client

Learn more: https://nextjs.org/docs/messages/static-route-dynamic
    at body (<anonymous>)
    at html (<anonymous>)
Error occurred prerendering page "/". Read more: https://nextjs.org/docs/messages/prerender-error
Export encountered an error on /page: /, exiting the build.
```

O stack só aponta `body`/`html`; `next build --debug-prerender` dá um stack melhor.
