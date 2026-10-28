# Root params (`next/root-params`)

## O que é

Os segmentos dinâmicos que ficam antes do layout raiz (aqui, `[lang]` em `app/catalog/[lang]/layout.tsx`) viram funções assíncronas importáveis de `next/root-params`. Qualquer Server Component ou utilitário de servidor lê o idioma com `await lang()`, sem receber `params` por prop.

Dentro de uma função com `'use cache'`, o Next rastreia quais root params foram lidos e só esses entram na chave do cache.

## Versão

Introduzido no Next 16.3.0; o lab usa 16.4.3. Os tipos (`lang(): Promise<string>`) são gerados em `.next/types/root-params.d.ts` pelo `next build`/`next dev`/`next typegen`.

## Onde no código

- `apps/catalog/lib/i18n.ts`: `currentLang()` lê `lang()` e chama `notFound()` se o valor não estiver em `LANGS`; `t(key, vars?)` usa o idioma corrente para escolher o texto.
- `apps/catalog/app/catalog/[lang]/layout.tsx`: `<html lang={await currentLang()}>`. É aqui que `/catalog/xx` vira 404.
- `apps/catalog/lib/data.ts`: `getProductList()` e `getProductDetail(id)` leem `lang()` dentro do `'use cache'`, então o cache se divide por idioma sem o idioma aparecer nos argumentos.
- Componentes profundos (`StockBlock`, `products/[id]/Reviews.tsx`) chamam `t()` sem receber o idioma.

## Restrições observadas

- `next/root-params` não funciona em Route Handlers, Server Actions nem Client Components. Por isso o `opengraph-image.tsx` (um Route Handler especializado) lê o idioma de `params`, e o fallback do `catchError` (Client Component) recebe os textos já traduzidos por props.
- Com Cache Components, o layout raiz precisa de `generateStaticParams` com pelo menos um valor por root param (`pt`, `en`), senão o build falha.
- `dynamicParams = false` não existe com Cache Components. O idioma não suportado é barrado pelo `notFound()` do layout, que roda antes de qualquer `<Suspense>` (o `lang()` é lido fora de boundary para montar o `<html>`), então a resposta é um 404 de verdade.

## Como observar

- `http://localhost:3000/catalog/pt/products/1` mostra "Avaliações" e "5 em estoque"; `/catalog/en/products/1` mostra "Reviews" e "5 in stock". Nenhum desses componentes recebe `lang` por prop.
- `curl -i http://localhost:3000/catalog/xx` → `404`, com a página 404 padrão do Next.
- `e2e/catalog.spec.ts`: "lang root param localizes deep components" e "unsupported lang is 404".
