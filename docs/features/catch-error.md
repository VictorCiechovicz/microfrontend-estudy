# `catchError` (`next/error`)

## O que é

`catchError(fallback)` cria um error boundary de componente, alternativa programática ao `error.tsx`. O fallback recebe `(props, { error, retry, reset })`. `retry()` busca de novo o payload RSC da página e re-renderiza os filhos dentro de uma Transition, então recupera erros de Server Components; `reset()` só limpa o estado no cliente. Erros de controle do Next (`notFound()`, `redirect()`) não são capturados: passam direto para o mecanismo do framework.

## Versão

`unstable_catchError` em 16.2.0; `catchError` estável em 16.3.0. Lab em 16.4.3.

## Onde no código

- `apps/catalog/app/catalog/[lang]/products/[id]/StockErrorBoundary.tsx` (`'use client'`): `catchError(StockFallback)`. O fallback mostra a mensagem e um `Button` de `@lab/ui` que chama `retry()`.
- Como o fallback é Client Component, ele não pode chamar `t()` (que usa `next/root-params`). A página traduz no servidor e passa `message={await t('stockUnavailable')}` e `retryLabel={await t('retry')}` como props, que o `catchError` repassa ao fallback.
- `products/[id]/page.tsx`: `<StockErrorBoundary><Suspense><StockBlock/></Suspense></StockErrorBoundary>`. Só o bloco de estoque cai; nome, preço e avaliações continuam na tela.
- `apps/catalog/app/catalog/api/lab/faults/route.ts`: `POST /catalog/api/lab/faults` com `{ "key": "stock", "count": n }` (n inteiro positivo) chama `injectFault`; qualquer outro corpo → `400`. Só para demo e e2e.

## Comportamento observado

Na primeira visita a um produto não listado, o Next faz duas renderizações quase ao mesmo tempo: a da requisição e a promoção ISR em segundo plano. Com o estoque dentro do HTML estático, as duas chamavam `getStock` e quem consumia a falha injetada dependia da ordem: às vezes o usuário via "5 em estoque" e o log mostrava `Error revalidating the page in the background Error: Stock service unavailable`. O e2e falhou 1 vez em 2 por isso.

A correção foi `await connection()` no `StockBlock`: a promoção em segundo plano para no `connection()` e nunca chama `getStock`; só a renderização da requisição consome a falha. O erro não fica no cache do `'use cache'`, então o `retry()` refaz a chamada e mostra o estoque.

Produto inexistente não chega a esse boundary: o proxy devolve `404` antes (ver `isr-shell.md`).

## Como observar

```bash
curl -X POST http://localhost:3000/catalog/api/lab/faults -H 'content-type: application/json' -d '{"key":"stock","count":1}'
```

Abrir `http://localhost:3000/catalog/pt/products/4` (ou outro produto cujo estoque não esteja no cache; `cacheLife("minutes")` revalida em 1 minuto): aparece "Estoque indisponível" com "Tentar de novo"; o clique troca por "5 em estoque" sem recarregar a página. Coberto por "stock error boundary retries the server component" em `e2e/catalog.spec.ts`.
