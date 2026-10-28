# Cache Components (`'use cache'`, `cacheTag`, `cacheLife`, `ensureStatic`)

## O que é

Com `cacheComponents: true`, nada é cacheado por padrão: o que deve entrar no HTML estático (ou num prefetch) precisa estar em `'use cache'`; o que é por requisição fica atrás de `<Suspense>` e é transmitido depois. `cacheTag` dá nome à entrada para invalidação (`revalidateTag`/`updateTag`) e `cacheLife` define stale/revalidate/expire.

`ensureStatic` (16.4) é um contrato de segmento: declara que certas etapas da navegação precisam sair estáticas, e o build falha se algo dinâmico vazar para elas.

## Versão

`cacheComponents` estável desde 16.0.0; `partialPrefetching` desde 16.3.0; `ensureStatic` e `navigation()` desde 16.4.0. Lab em 16.4.3.

## Onde no código

`apps/catalog/lib/data.ts`, todas com `'use cache'` e leitura no banco embrulhada em `withLatency` (400 ms) para a espera ficar visível:

| Função | Tag | `cacheLife` | Observação |
| --- | --- | --- | --- |
| `getProductList()` | `products` | `hours` (stale 5 min, revalidate 1 h, expire 1 dia) | idioma via `lang()` dentro do cache |
| `getProductDetail(id)` | `product:<id>` | `hours` | idem |
| `getProductStock(id)` | `stock:<id>` | `minutes` (stale 5 min, revalidate 1 min, expire 1 h) | lança enquanto há falha injetada; erro não é cacheado |

Dois buracos por requisição, de propósito:

- `StockBlock` chama `connection()` antes de `getProductStock`. O componente renderiza a cada requisição (atrás de `<Suspense>`), mas o dado continua no `'use cache'` de 1 minuto, então a maioria das requisições acerta o cache. Sem o `connection()`, o estoque entrava no HTML estático promovido pelo ISR e a falha injetada era consumida pela renderização em segundo plano, não pela do usuário (ver `catch-error.md`).
- As avaliações (`Reviews` em `products/[id]/page.tsx`) chamam `connection()` e leem o banco sem cache, atrás de `<Suspense fallback="Carregando avaliações…">`.

`apps/catalog/app/catalog/[lang]/layout.tsx` exporta `ensureStatic = 'prefetch'`: o App Shell e o prefetch por link de toda rota do catálogo têm de ser estáticos. O que lê cookie (`UserSlot`) já fazia `await navigation()` dentro de `<Suspense>`, então fica fora do shell e do prefetch.

## O que aconteceu no build com `ensureStatic = 'prefetch'`

O build passou de primeira, sem erro: os valores `'shell'` e `'prefetch'` não acrescentam validação de build (a doc instalada diz isso explicitamente; só `'navigation'` valida). Para ver a validação funcionando, foi testado `ensureStatic = 'navigation'` na página de produto, e o build falhou com:

```
Error: Route "/catalog/[lang]/products/[id]": Next.js encountered uncached or runtime data on a route that must be fully static.
    at Suspense / div / header / body / html     (UserSlot: cookies() no layout)
    at Suspense / main / body / html             (Reviews: connection())
```

Ou seja, `'navigation'` exigiria tirar o cookie do servidor e cachear as avaliações. Ficou `'prefetch'`, como no plano.

## Como observar

- Saída do `pnpm --filter catalog build`: as rotas aparecem como `◐` (Partial Prerender): HTML estático com buracos transmitidos.
- `/catalog/pt/products/1`: nome e preço chegam no HTML inicial (cacheados no build); o estoque e as avaliações chegam transmitidos ("Carregando avaliações…" é trocado pelas avaliações uns 400 ms depois).
- Invalidação: `curl -X POST http://localhost:3001/internal/revalidate -H 'x-lab-secret: lab-dev-secret' -H 'content-type: application/json' -d '{"tags":["stock:1"]}'` expira só o estoque do produto 1.
