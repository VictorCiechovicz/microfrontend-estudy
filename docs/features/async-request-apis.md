# `params`, `searchParams` e `cookies()` assíncronos (breaking)

## O que é

No Next 16 o acesso síncrono a esses dados foi removido: `params` e `searchParams` chegam como `Promise`, e `cookies()`, `headers()` e `draftMode()` devolvem `Promise`. Todo uso exige `await` (ou `use()` num Client Component). O codemod `@next/codemod` migra o código antigo.

## Versão

Quebra da 16.0.0 (a versão 15 ainda aceitava o acesso síncrono com aviso). Lab em 16.4.3.

## Onde no código

É o padrão de todo o código do lab, sem arquivo próprio:

- `params: Promise<{ id: string }>` em `apps/catalog/app/catalog/[lang]/products/[id]/page.tsx`, `.../opengraph-image.tsx`, `apps/account/app/orders/[id]/page.tsx` e `@modal/(.)orders/[id]/page.tsx`.
- `searchParams: Promise<...>` em `apps/account/app/login/page.tsx` e `apps/catalog/app/catalog/[lang]/lab/errors/page.tsx`.
- `(await cookies())` em `apps/account/app/login/actions.ts` e `apps/*/lib/session.ts`.
- Root params têm a mesma forma: `await lang()` (ver `root-params.md`).

## Como observar

Não há um efeito visível: o `next build` e o `tsc --noEmit` falham se alguém escrever `params.id` sem `await`, porque os tipos gerados são `Promise`. Com `cacheComponents`, ler `cookies()` ou `searchParams` fora de um `<Suspense>` também derruba o build (ver `cache-components.md`).
