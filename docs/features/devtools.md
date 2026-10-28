# DevTools do `next dev`: Instant Insights e Navigation Inspector

## O que é

Dois painéis do selo do Next (canto inferior esquerdo do `next dev`), ligados a Instant Navigations:

- **Instant Insights** lista, por rota, o que impede a navegação de ser instantânea (dado por requisição fora de `<Suspense>`), com a correção sugerida (`Stream` ou `Block`).
- **Navigation Inspector** pausa as navegações no shell de carregamento para inspecioná-lo.

## Versão

Next 16.3 em diante; lab em 16.4.3. Só existem em desenvolvimento. O guia instalado é `02-guides/instant-navigation.md`.

## Onde no código

Nada específico: valem para as zonas com `cacheComponents` + `partialPrefetching` (catalog e account). O insight real do lab foi a página de produto, corrigida como descrito em `partial-prefetching.md#desvio-suspense-em-volta-do-corpo-da-página-de-produto`.

## Como observar

`pnpm --filter catalog dev`, abrir `/catalog/pt/products/1` e clicar no selo. O que foi visto (e o que só foi lido na doc, como a pausa no Navigation Inspector) está registrado em `instant-test.md` (seção "DevTools do `next dev`"). O equivalente automatizado é `instant()` no e2e.
