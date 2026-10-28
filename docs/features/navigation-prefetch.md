# `navigation()` e `prefetch()`: escolher a etapa de cada subárvore

## O que é

Com Partial Prefetching, o servidor entrega a rota em três etapas: App Shell (todo `<Link>`), prefetch por link (`<Link prefetch>`) e navegação. Duas funções de `next/cache` empurram uma subárvore para uma etapa mais tardia sem torná-la "por requisição" como o `connection()` faz:

- `await prefetch()`: o que vem abaixo sai do App Shell, mas pode entrar no prefetch por link.
- `await navigation()`: o que vem abaixo sai do App Shell e do prefetch por link; só renderiza quando o usuário navega.

Nos dois casos, o fallback do `<Suspense>` mais próximo é o que aparece na etapa anterior.

## Versão

As duas funções são do Next 16.4.0 (antes eram `unstable_prefetch`/`unstable_navigation` no canary). Assinatura no 16.4.3: `function navigation(): Promise<void>` e `function prefetch(): Promise<void>`, sem parâmetros. Lançam erro dentro de `'use cache'`, de `after()`, de `generateStaticParams` ou de Client Component.

## Onde no código

- `apps/catalog/app/catalog/[lang]/products/[id]/Related.tsx`: `await prefetch()` e depois `getRelatedProducts(id)` (`'use cache'`, tag `products`, `cacheLife('hours')`, em `apps/catalog/lib/data.ts`, por cima de `getRecommendations` do `@lab/db`). Os nomes vêm em inglês porque `getRecommendations` lê a tradução `en`. Fallback: "Loading related…".
- `apps/catalog/app/catalog/[lang]/products/[id]/Reviews.tsx`: `await navigation()` e depois `listReviews(id)` sem cache (com a latência artificial de `withLatency`). Fallback: `t('loadingReviews')` ("Carregando avaliações…"). Cada avaliação tem `data-testid="review"`.
- `apps/catalog/app/components/UserSlot.tsx` já usava `navigation()` desde a Task 8 (cookie de sessão fora do shell e do prefetch).

## Por que as avaliações ficaram sem `'use cache'`

A doc sugere `navigation()` + uma função `'use cache'` abaixo dela. Aqui isso não serve para os ids 1–3: a doc avisa que "static prerenders still include the content", ou seja, o prerender do build atravessa o `navigation()`, cacheia as avaliações e elas passam a vir no prefetch estático, que é exatamente o que este exemplo quer evitar. Com a leitura sem cache, o prerender para no `setTimeout` do `withLatency` e as avaliações viram um buraco que só a navegação preenche, inclusive para os ids pré-renderizados. Já `Related` quer o contrário (entrar no prefetch por link), por isso usa cache.

## Como observar

1. `pnpm prod`, abra `http://localhost:3000/catalog/pt`, espere a lista carregar e clique em "Produto 2": título, preço e "Related" aparecem na hora; "Carregando avaliações…" fica uns 400 ms até as avaliações chegarem.
2. Na aba Network, a resposta `__PAGE__` do prefetch de `products/2` contém "Product 12" (Related) e não contém "Review 1 of product 2" (ver `partial-prefetching.md`).
3. A partir de "Related", os links são `<Link>` comuns (só App Shell). Clicar num deles mostra primeiro o fallback da página e depois o produto.
4. `e2e/instant.spec.ts` › "product title is instant, reviews stream after navigation" e "related products link to other product pages".
