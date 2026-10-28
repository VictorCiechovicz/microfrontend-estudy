# ISR com Cache Components (shell instantâneo para params não listados)

## O que é

`generateStaticParams` da página de produto devolve só `1`, `2` e `3`. Com `cacheComponents` + `partialPrefetching`, os demais ids não esperam um render completo na primeira visita: o Next serve na hora o App Shell pré-renderizado da rota (cabeçalho, rodapé, fallbacks) e transmite o conteúdo do produto. Em segundo plano, ele renderiza a página com o id já conhecido e grava o resultado; as visitas seguintes recebem essa versão "promovida", igual à dos ids listados.

## Versão

Servir o App Shell para params não listados é do Next 16.3; antes, a primeira requisição esperava o render completo. Lab em 16.4.3.

## Onde no código

- `apps/catalog/app/catalog/[lang]/products/[id]/page.tsx`: `generateStaticParams` com `1..3`; `notFound()` quando `getProductDetail` devolve `null`.
- `apps/catalog/proxy.ts`: confere se o produto existe antes de renderizar (ver abaixo).
- Resultado gravado em `apps/catalog/.next/server/route-cache/APP_PAGE/<hash>/$/catalog/pt/products/<id>.{html,meta,segments}` (por isso o `pnpm e2e` apaga esse diretório antes de rodar).

## Desvio do plano: 404 de verdade para produto inexistente

O plano pedia só o `notFound()` na página. No 16.4.3 isso não basta: como o shell de um id não listado é enviado imediatamente, o status `200` já foi comprometido quando a página descobre que o produto não existe. Medido com `curl` contra o catálogo:

| Requisição | Status |
| --- | --- |
| 1ª `/catalog/pt/products/9999` | `200` (shell + UI de not-found transmitida, com `noindex`) |
| 2ª `/catalog/pt/products/9999` | `404` (a versão promovida já é um not-found) |

Mover o `await params` para fora de `<Suspense>` não mudou nada (o Next serve o shell do layout mesmo assim), e tirar o `ensureStatic` também não. `ensureStatic = 'navigation'` na página faria a primeira visita esperar o render completo, mas quebra o build por causa do cookie no cabeçalho e das avaliações por requisição (ver `cache-components.md`). Não existe opt-out de `partialPrefetching` por rota com a flag global ligada.

A doc instalada (`loading.md` → "Status codes") recomenda checar o slug no Proxy. Foi o que se fez: `apps/catalog/proxy.ts` casa só `/catalog/:lang/products/:id`, faz uma leitura síncrona no SQLite (`getProduct`, sem a latência artificial) e, se o produto não existe, reescreve para `/catalog/<lang>/_missing`. Pastas com `_` nunca viram rota no App Router, então a reescrita sempre cai no 404 da zona, com status `404` antes de qualquer byte do shell. O `notFound()` da página continua lá para o caso de o produto sumir entre o proxy e o render; aí vale o `not-found.tsx` de `[lang]`, transmitido com `200` + `noindex`.

Efeito colateral: a página 404 é a padrão do Next (sem cabeçalho/rodapé da loja), porque a URL reescrita não passa pelo layout `[lang]`.

## Como observar

1. `pnpm prod`, depois `curl -s -D - -o /dev/null http://localhost:3001/catalog/pt/products/10`: `200` com `x-nextjs-prerender: 1` (foi servido o shell pré-renderizado).
2. Logo em seguida, `ls apps/catalog/.next/server/route-cache/APP_PAGE/*/'$'/catalog/pt/products/` mostra `10.html`.
3. A segunda requisição devolve o HTML promovido: o `<h1>` já vem dentro do shell, como em `/catalog/pt/products/1`; estoque e avaliações continuam transmitidos.
4. `curl -i http://localhost:3001/catalog/pt/products/9999` → `404` já na primeira vez.
5. `e2e/catalog.spec.ts`: "non-prerendered product serves and then caches" e "unknown product is 404, not the stock error UI".
