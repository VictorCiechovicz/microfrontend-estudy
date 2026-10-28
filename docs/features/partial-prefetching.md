# Partial Prefetching (App Shell + prefetch por link)

## O que é

Com `partialPrefetching: true`, um `<Link>` comum não busca mais a rota inteira: busca só o **App Shell** da rota, a parte que não depende da URL (layouts, conteúdo estático, fallbacks de `<Suspense>`). Esse shell é um por rota e é reaproveitado por todo link que aponta para ela.

`<Link prefetch>` (ou `prefetch={true}`) pede mais: o **prefetch por link** resolve `params`/`searchParams` daquele link e traz o conteúdo cacheado que depende deles. É a segunda etapa de navegação; a terceira é a própria navegação, que renderiza o resto.

## Versão

`partialPrefetching` existe desde o Next 16.3.0 e exige `cacheComponents`. O lab usa 16.4.3. A "prefetch inlining" (`experimental.prefetchInlining`) vem ligada por padrão no 16.4.3 (`maxSize` 2 KB por segmento, `maxBundleSize` 10 KB por resposta): segmentos pequenos não ganham requisição própria, vão embutidos na resposta de outro segmento.

## Onde no código

- `apps/catalog/next.config.ts`: `cacheComponents: true`, `partialPrefetching: true`.
- `apps/catalog/app/catalog/[lang]/layout.tsx`: `ensureStatic = 'prefetch'` exige que App Shell e prefetch por link saiam de saída estática (o build continua passando).
- `apps/catalog/app/catalog/[lang]/page.tsx`: `ProductLink` usa `<Link prefetch transitionTypes={['slide']}>` para cada produto da lista.
- `apps/catalog/app/catalog/[lang]/products/[id]/page.tsx`: o corpo da página, que lê `params`, fica dentro de `<Suspense fallback={<main aria-busy="true" />}>`. No App Shell da rota só entra esse fallback; nome e preço entram no prefetch por link, que já conhece o `id`.
- `apps/catalog/app/catalog/[lang]/products/[id]/Related.tsx` e `Reviews.tsx`: escolhem a etapa com `prefetch()` e `navigation()` (ver `navigation-prefetch.md`).

## Desvio: `<Suspense>` em volta do corpo da página de produto

Até a Task 8 a página lia `await params` fora de `<Suspense>`. No `next dev` isso gera um Instant Insight ("Next.js encountered URL data outside of Suspense", `app/catalog/[lang]/products/[id]/page.tsx (25:29)`), porque um `<Link>` sem `prefetch` (os links de "Related", por exemplo) não teria nada da página no App Shell e a navegação travaria. O corpo foi movido para um componente `Product` dentro de `<Suspense>`, que é a correção "Stream" proposta pelo próprio insight. O mesmo foi feito em `guides/[slug]/page.tsx`. Os ids de `generateStaticParams` continuam com o `<h1>` no HTML estático.

## Como observar

1. `EXPOSE_TESTING_API=1 pnpm build` (ou só `pnpm prod`) e abra `http://localhost:3000/catalog/pt` com a aba **Network** do DevTools do navegador filtrada por `_rsc`.
2. Assim que a lista aparece, surgem dois tipos de requisição com o cabeçalho `next-router-segment-prefetch`:
   - `/_tree`: a árvore de segmentos da rota (≈ 500 bytes), uma por rota/página pré-renderizada.
   - `/catalog/$d$lang/products/$d$id/__PAGE__`: uma por link com `prefetch`, para `products/1` a `products/12`.
3. Não aparece requisição separada para o segmento do layout `[lang]`: ele foi embutido (inlining). Medido no build de produção: a resposta `__PAGE__` de `products/2` tem ≈ 7 KB e contém o rodapé do layout ("Next 16 microfrontends lab"), o "Produto 2" e os links de "Related", mas não as avaliações. Os cabeçalhos da resposta trazem `x-nextjs-prerender: 1` e `x-nextjs-cache: HIT`: o prefetch veio da saída estática, como o `ensureStatic = 'prefetch'` exige.
4. `e2e/instant.spec.ts` › "product title is instant, reviews stream after navigation" trava a navegação no estado prefetched e confere que título e "Related" estão lá e as avaliações ainda não.
