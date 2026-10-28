# `navigation()` e `prefetch()`: escolher a etapa de cada subárvore

## O que é

Com Partial Prefetching, o servidor entrega a rota em três etapas: App Shell (todo `<Link>`), prefetch por link (`<Link prefetch>`) e navegação. Duas funções de `next/cache` empurram uma subárvore para uma etapa mais tardia sem torná-la "por requisição" como o `connection()` faz:

- `await prefetch()`: o que vem abaixo sai do App Shell, mas pode entrar no prefetch por link.
- `await navigation()`: o que vem abaixo sai do App Shell e do prefetch por link; só renderiza quando o usuário navega.

Nos dois casos, o fallback do `<Suspense>` mais próximo é o que aparece na etapa anterior.

## Versão

As duas funções são do Next 16.4.0 (antes eram `unstable_prefetch`/`unstable_navigation` no canary). Assinatura no 16.4.3: `function navigation(): Promise<void>` e `function prefetch(): Promise<void>`, sem parâmetros. Lançam erro dentro de `'use cache'`, de `after()`, de `generateStaticParams` ou de Client Component.

## `prefetch()`: bloco "Populares" na página de produto

`apps/catalog/app/catalog/[lang]/products/[id]/Popular.tsx` faz `await prefetch()` e depois `getPopularProducts()` (`'use cache'`, tag `products`, `cacheLife('hours')`, em `apps/catalog/lib/data.ts`, por cima de `getRecommendations(undefined, 3)`). Fica em `page.tsx` ao lado do `<Suspense>` do produto, com fallback `t('loadingPopular')` ("Carregando populares…"/"Loading popular…") e título `t('popular')` ("Populares"/"Popular"). "Related" usa `t('related')` ("Relacionados"/"Related") e `t('loadingRelated')`. Os nomes dos produtos nesses dois blocos continuam em inglês porque `getRecommendations` lê a tradução `en`.

O bloco não lê `params` nem cookie e o dado é cacheado: sem o `prefetch()` ele entraria no App Shell da rota. Com o `prefetch()`:

- Um `<Link>` comum (os links de "Relacionados") carrega só o App Shell: no instante do clique aparece "Carregando populares…".
- Um `<Link prefetch>` (a lista do catálogo) carrega também o prefetch por link: "Populares" já aparece pronto.

A primeira versão desta tarefa punha o `prefetch()` em `Related`. Lá ele não fazia nada: "Related" depende do `id` da URL, e conteúdo atrás de `params` já fica fora do App Shell por conta própria (a doc instalada diz isso). `Related.tsx` agora não chama `prefetch()`; continua no prefetch por link porque o dado é cacheado e o `id` é conhecido nessa etapa.

Detalhe observado no build de produção: o App Shell de um id que não está em `generateStaticParams` só sai sem "Populares" depois que o Next promove a página desse id (ISR, ver `isr-shell.md`). Na primeira vez, a resposta do prefetch é o "fallback shell" estático da rota (`x-nextjs-cache: MISS`, ≈ 5,6 KB), e esse prerender inclui o "Populares". O teste por isso visita o destino antes e espera o arquivo aparecer em `route-cache`.

## `navigation()`: não tem efeito observável neste lab

`apps/catalog/app/catalog/[lang]/products/[id]/Reviews.tsx` faz `await navigation()` como o brief pede, seguido da leitura sem cache das avaliações (`listReviews` com `withLatency`). Fallback: `t('loadingReviews')`, cada avaliação com `data-testid="review"`.

Neste lab o `navigation()` não muda nada que se possa ver, e isso foi medido:

1. **Avaliações sem cache, sem `navigation()`.** Os 7 testes de `e2e/instant.spec.ts` passam do mesmo jeito. Quem tira as avaliações do prefetch é a leitura sem cache: o prerender para no `setTimeout` do `withLatency`.
2. **Avaliações com `'use cache'` (tag `product:<id>`), com e sem `navigation()`.** Nos dois casos as avaliações chegam junto com o prefetch por link, tanto em `products/2` (em `generateStaticParams`) quanto em `products/5` (gerado por ISR): a resposta `__PAGE__` (`x-nextjs-cache: HIT`, ≈ 8,5 KB) contém "Review 1 of product …" e, dentro do `instant()`, as avaliações aparecem e o "Carregando avaliações…" não.

O motivo está na doc instalada: "Static prerenders still include the content in their output, so it can appear in a static prefetch". Com `ensureStatic = 'prefetch'` no layout raiz, todo prefetch por link vem de saída estática (o lab confirma: `x-nextjs-prerender: 1` em todas as respostas). O `navigation()` só tira conteúdo de um prefetch **renderizado em tempo de execução**, e essa configuração não deixa existir nenhum. Pela mesma razão, o `navigation()` do `UserSlot` (Task 8) também não muda nada: o `ensureStatic = 'prefetch'` já empurra o cookie para a etapa de navegação ("Setting 'prefetch' enforces that stage boundary across the route without adding await navigation()", doc de `ensureStatic`).

### Segunda tentativa: `ensureStatic` só na página da lista

A doc de `ensureStatic` diz que o nível definido num `page.tsx` vale para a rota daquela página (e os layouts acima dela), não para as outras rotas. Foi testado mover `ensureStatic = 'prefetch'` do layout `[lang]` para `[lang]/page.tsx`, deixando a rota de produto sem nenhum nível, com as avaliações cacheadas (`'use cache'`, tag `product:<id>`) abaixo do `navigation()`.

Resultado no build de produção, navegando da lista dentro do `instant()`: nada mudou. As respostas `__PAGE__` de `products/2` e `products/5` continuaram com `x-nextjs-prerender: 1` e ≈ 8,6 KB, contendo "Review 1 of product …", e as 4 avaliações apareceram no instante do clique, sem "Carregando avaliações…". A página de produto não lê nada da requisição antes do `navigation()`, então o Next serve o prefetch por link a partir da saída estática por id (pré-renderizada no build ou promovida por ISR). E essa saída inclui o que está abaixo do `navigation()`, com ou sem `ensureStatic`.

Pela doc de `navigation()`, o efeito só aparece quando o prefetch por link é renderizado na hora, o que acontece quando a rota lê `cookies()`/`headers()` acima do `navigation()`. O lab não tem esse caso na página de produto, e criar um só para isso ficou fora do escopo. A mudança foi revertida: `ensureStatic = 'prefetch'` voltou para o layout `[lang]`, e as avaliações voltaram a ser lidas sem cache.

## Como observar

1. `pnpm prod` e abra `http://localhost:3000/catalog/pt/products/2`. Clique num link de "Relacionados": a página nova mostra "…" e "Carregando populares…" até o conteúdo chegar.
2. Volte a `/catalog/pt` e clique em "Produto 3" (link com `prefetch`): título, preço, "Relacionados" e "Populares" aparecem na hora; só as avaliações ficam em "Carregando avaliações…".
3. `e2e/instant.spec.ts`:
   - "product title is instant, reviews stream after navigation": "Populares" já vem pronto pelo prefetch por link.
   - "popular block is out of the App Shell a default link loads": com só o App Shell, aparece o "Carregando populares…" e a região "Populares" não existe.
   - Tirar o `await prefetch()` de `Popular.tsx` faz este último falhar ("Carregando populares…" não aparece).
