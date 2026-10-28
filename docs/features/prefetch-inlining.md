# Prefetch inlining

## O que é

Cada segmento de rota (layout/página) é prefetchado como um pedaço próprio. O inlining embute segmentos pequenos na resposta de outro segmento, para reduzir a quantidade de requisições. É comportamento permanente do App Router; só a opção `experimental.prefetchInlining` é experimental, para ajustar ou desligar na depuração.

## Versão

Opção adicionada na 16.2.0 e **ligada por padrão desde a 16.3.0** (`prefetchInlining.md` instalado). Padrões no 16.4.3: `maxSize` de 2 KB por segmento e `maxBundleSize` de 10 KB por resposta.

## Onde no código

Nenhum: é automático, e o lab não altera a opção. A relação com Partial Prefetching está em `partial-prefetching.md` (seção "Versão").

## Como observar

Aba Network do navegador, filtrando por `_rsc`, ao passar o mouse sobre links do catálogo. Honesto: o lab não mediu a contagem de requests com e sem a opção; a nota só registra o padrão da versão instalada. Para comparar, ligue `experimental: { prefetchInlining: false }` numa zona e repita.
