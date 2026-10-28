# Teste de navegação instantânea (`instant()` do `@next/playwright`) e DevTools

## O que é

`instant(page, fn)` liga uma trava de navegação enquanto `fn` roda: toda navegação mostra só o que já estava prefetched (ou, numa carga inicial, o shell estático) e o conteúdo dinâmico fica parado até `fn` terminar. Assim o teste afirma o que o usuário vê **no instante** do clique, sem corrida com o streaming.

## Versão

`@next/playwright@16.4.3`, instalado exatamente nessa versão na raiz (`devDependencies`). Assinatura instalada:

```ts
instant<T>(page, fn: () => Promise<T>, options?: { baseURL?: string }): Promise<T>
```

O protocolo é um cookie (`next-instant-navigation-testing`) gravado no contexto do navegador; o Next observa o cookie pelo CookieStore e trava as navegações. `baseURL` só é necessário quando `page.goto()` é a primeira navegação dentro do escopo.

## Desvio: API de teste no build de produção

No `next dev` a API de teste vem ligada sozinha. O `pnpm e2e` roda contra build de produção, e lá ela só existe com `experimental.exposeTestingApiInProductionBuild` (16.2.0). Sem isso o cookie não trava nada. Ficou assim:

- `apps/catalog/next.config.ts`: `exposeTestingApiInProductionBuild: process.env.EXPOSE_TESTING_API === "1"`.
- `package.json` (raiz): `e2e` faz `EXPOSE_TESTING_API=1 pnpm build`.
- `turbo.json`: `build.env: ["EXPOSE_TESTING_API"]`, para a variável chegar ao `next build` e entrar no hash do cache do Turbo (senão um build sem a API seria reaproveitado). O `pnpm prod` continua gerando o build sem ela.

A variável precisa estar no `next build`; passá-la só no `next start` não adiciona a API a um build existente.

## Desvio: seletor do link

O brief usa `getByRole('link', { name: /Produto 2/ })`. Com 12 produtos no seed, a regex casa "Produto 2" e "Produto 12" e o Playwright falha em modo estrito. O teste usa `{ name: "Produto 2", exact: true }` e espera a URL de destino (`waitForURL`) antes de afirmar, como a doc instalada recomenda.

## Onde no código

- `e2e/instant.spec.ts`: "product title is instant, reviews stream after navigation" (link com `prefetch`; dentro do `instant`: `<h1>` com "Produto 2", regiões "Related" e "Popular" visíveis, "Carregando avaliações…" visível, zero `review`; depois do escopo: as avaliações aparecem).
- `e2e/instant.spec.ts`: "popular block is out of the App Shell a default link loads" (link comum de "Related"; dentro do `instant` só existe o App Shell: "Loading popular…" visível, região "Popular" ausente). Ver `navigation-prefetch.md`.

## DevTools do `next dev` (conferido com `pnpm --filter catalog dev`)

- **Instant Insights**: o selo do Next no canto inferior esquerdo mostra "N Insight(s)" (laranja) ao lado de "Issues" (vermelho). Clicar abre o painel com etiquetas `Instant` e `Server`, o arquivo e a linha do problema e dois cartões de correção, **Stream** (envolver em `<Suspense>`) e **Block** (`export const instant = false`), cada um com "Copy prompt". O mesmo texto sai no terminal do `next dev`. Foi assim que apareceu o insight da página de produto descrito em `partial-prefetching.md`; depois da correção ele sumiu.
- **Navigation Inspector**: clique no selo "N" → menu com Issues, Bundler, Cache Components (Enabled), **Navigation Inspector** e Route Info. O painel abre com o interruptor **Pause on navigations** ("When enabled, every navigation will pause so you can inspect the loading shell before resuming"). Segundo a doc instalada (`02-guides/instant-navigation.md`), com ele ligado a próxima recarga ou clique congela a página no shell ("Loading shell", rotulado "Page load" ou "Client nav", com as URLs) até você clicar em Resume; essa parte não foi exercitada aqui. Ligar a pausa equivale ao início do escopo de `instant()`; Resume equivale ao fim.
- O painel Suspense do React DevTools (extensão do navegador) complementa: lista os `<Suspense>` e permite alternar cada um entre fallback e conteúdo.

## Como observar

1. `pnpm e2e e2e/instant.spec.ts`.
2. Para ver falhar: troque `<Link prefetch ...>` por `<Link ...>` em `ProductLink` (`apps/catalog/app/catalog/[lang]/page.tsx`). Sem o prefetch por link, no instante do clique só existe o App Shell da rota (o fallback vazio da página): a URL muda, mas o `<h1>` não aparece dentro do escopo e o teste falha em `expect(...).toContainText("Produto 2")`. Conferido no build de produção. Antes da correção do `<Suspense>` (estado da Task 8) a falha era outra: a navegação nem se completava e o teste estourava os 30 s.
