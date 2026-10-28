# Module Federation

O remote `widgets` (`apps/widgets`, porta 3003) é um app Rsbuild 2.2.14 com o `@module-federation/rsbuild-plugin` 2.9.2. As zonas Next não são buildadas com Module Federation: elas carregam os widgets **só no navegador**, em tempo de execução, pelo pacote `@lab/mf-host` (runtime do `@module-federation/enhanced` 2.9.2).

| Peça | Onde | Papel |
|---|---|---|
| Remote `widgets` | `apps/widgets/rsbuild.config.ts` | expõe `./HelloWidget`, `./CartWidget` e `./Recommendations`, publica `http://localhost:3003/mf-manifest.json` |
| `getFederation()` | `packages/mf-host/src/runtime.ts` | instância única de `createInstance`, registra o remote e o React do host no `shared` |
| `<RemoteWidget>` | `packages/mf-host/src/RemoteWidget.tsx` | Client Component: `loadRemote('widgets/<name>')` no `useEffect`, renderiza o `default` dentro de um error boundary, ou o fallback |
| Uso | `apps/catalog/app/catalog/[lang]/page.tsx` | `<RemoteWidget name="HelloWidget" />` dentro de um Server Component |
| Uso | layouts do catálogo e da conta | `cartSlot={<RemoteWidget name="CartWidget" />}` no `SiteHeader` |
| Uso | `apps/catalog/app/catalog/[lang]/products/[id]/page.tsx` | `<RemoteWidget name="Recommendations" props={{ excludeId }} />` |

A URL do remote vem de `NEXT_PUBLIC_WIDGETS_URL`, com default `http://localhost:3003` no código.

## Por que o Module Federation fica fora do Next

- O App Router do Next 16 compila com Turbopack, que não tem plugin de Module Federation. Não dá para declarar `remotes`/`exposes` no build de uma zona.
- O `@module-federation/nextjs-mf` só funciona com o Pages Router e webpack, e está em modo manutenção. Trocar o bundler de uma zona por webpack ou usar iframe estão fora das regras do lab.
- Por isso a federação acontece só em runtime: o Next empacota o `@module-federation/enhanced/runtime` como uma dependência qualquer, e o `RemoteWidget` busca o manifest, o `remoteEntry` e o chunk do widget depois da hidratação. No servidor (SSR/RSC) o widget não existe: o HTML da zona sai sem ele.

## Entradas do `@lab/mf-host`

| Entrada | Exporta | Onde pode ser importada |
|---|---|---|
| `@lab/mf-host` | `RemoteWidget` e os tipos `WidgetName`, `WidgetProps`, `RemoteWidgetProps` | qualquer lugar. O arquivo tem `"use client"`, então um Server Component recebe uma referência de cliente, que é o que se quer para um componente |
| `@lab/mf-host/runtime` | `getFederation()` | só em Client Components. Importada por um Server Component, o build falha com `You're importing a component that imports react-dom/client. It only works in a Client Component...` |
| `@lab/mf-host/strategy` | `MF_STRATEGY` | qualquer lugar. Num Server Component chega o valor (`"shared"`), não uma referência de cliente |

Antes, `getFederation` e `MF_STRATEGY` saíam do entry `"use client"`. Um Server Component que importasse `MF_STRATEGY` recebia uma referência de cliente no lugar da string. Por isso a constante foi para um módulo sem diretiva e sem dependência de React.

Os nomes e as props aceitos ficam em `WidgetProps`: `HelloWidget` e `CartWidget` sem props, `Recommendations` com `{ excludeId?: number; lang?: 'pt' | 'en' }`. As props passam do Server Component para o Client Component, então precisam ser serializáveis.

## Estratégia escolhida: `shared` (`MF_STRATEGY = 'shared'`)

O host registra o React que o Next empacotou (`lib: () => React`, `version: React.version`, `singleton: true`, `requiredVersion: false`) e o remote declara os mesmos pacotes como `singleton`. Os pacotes compartilhados são `react`, `react/jsx-runtime`, `react/jsx-dev-runtime`, `react-dom` e `react-dom/client`. O widget roda dentro da árvore React da zona: hooks, contexto e Suspense são os do host.

Até a Task 11 só `react`, `react-dom` e `react-dom/client` eram compartilhados, e a afirmação de que "o React do remote não é executado" estava errada: o JSX compilado do widget importa `react/jsx-runtime`, que não estava no `shared` e por isso ia empacotado no chunk do widget, na versão 19.3.1 do remote, e era avaliado no navegador. Funcionava porque o `jsx-runtime` de produção do React 19 não importa o `react` (só monta objetos com `Symbol.for('react.transitional.element')`, que o React do host reconhece), mas era código do React do remote rodando na página. Agora o `jsx-runtime` também vem do host. O `jsx-dev-runtime` entra no `shared` para o modo dev, em que o Rsbuild compila o JSX com `jsxDEV`.

O teste `widget runs on the host's React, JSX runtime included` (`e2e/mf-spike.spec.ts`) lê `window.__FEDERATION__.__SHARE__` e confere duas coisas: `react`, `react-dom/client` e `react/jsx-runtime` têm uma entrada do `lab_host` com `useIn: ['widgets']`, e nenhuma entrada registrada pelo `widgets` tem `loaded: true`, ou seja, nenhuma fábrica de React do remote foi chamada. Antes da mudança ele falhava porque não existia entrada `react/jsx-runtime` do host.

Os chunks do React do remote ainda são baixados: o manifest lista os chunks dos `shared` como assets síncronos (`react-dom/client` sozinho tem ~207 kB, ~65 kB gzip) e o runtime os busca junto com o widget, mas não os avalia. Declarar `import: false` nos `shared` do remote evitaria o download, ao custo de o remote não ter React próprio para o modo standalone.

Limitação: com host em produção e remote em dev (ou o contrário), o `jsx-dev-runtime` compartilhado é o do host. O de produção exporta `jsxDEV` como `undefined`, e um remote em dev quebraria. `pnpm dev` e `pnpm prod` sobem tudo no mesmo modo, então isso só acontece misturando os comandos à mão.

Cada módulo exposto exporta também `mount(el, props)` (`apps/widgets/src/mount.tsx`), para o caso de um dia o host precisar trocar para a estratégia `mount`.

### O que falhou na primeira tentativa de `shared`

Com o `shared` exatamente como o plano descrevia (só `react` e `react-dom`), o widget caía no fallback e o console mostrava:

```
Error: Minified React error #527; visit https://react.dev/errors/527?args[]=19.3.0-canary-278794d7-20261002&args[]=19.3.1
    at Object.u (http://localhost:3003/static/js/w.db19be36c1.js:2:200504)
    at __webpack_require__ (http://localhost:3003/static/js/widgets.1dc17b5d9d.js:7:7996)
    at Object.R (http://localhost:3003/static/js/async/__federation_expose_HelloWidget.b1f5558086.js:2:286)
```

O erro #527 é "Incompatible React versions: The "react" and "react-dom" packages must have the exact same version". A causa:

1. O App Router não usa o `react` do `node_modules`: usa a cópia embutida em `next/dist/compiled/react`, que no 16.4.3 é `19.3.0-canary-278794d7-20261002`. É essa a versão que o host registra.
2. O `HelloWidget` importa `react-dom/client` (para o `mount`). Como só `react-dom` estava no `shared`, o subpath `react-dom/client` foi empacotado dentro do remote, na versão 19.3.1 do `node_modules` dele.
3. Esse `react-dom/client` 19.3.1 recebeu o `react` compartilhado (o canary do host) e recusou a combinação ao ser avaliado.

Correção: compartilhar também `react-dom/client` (no `rsbuild.config.ts` e no `getFederation()`). Com isso o remote usa `react`, `react-dom` e `react-dom/client` do host, e o `e2e/mf-spike.spec.ts` passa sem `Invalid hook call` nem aviso de cópia duplicada do React.

Detalhe: o `singleton` resolveu a versão a favor do host mesmo com o remote oferecendo 19.3.1, maior que o canary. Na tabela de share (`window.__FEDERATION__.__SHARE__`) as entradas `19.3.1` do remote ficam com `loaded: false` e as do host com `useIn: ['widgets']`.

### A estratégia `mount` também foi testada

Para comparar, o spike rodou a variante `mount`: remote sem `shared` (cada um com seu React), e `RemoteWidget` chamando `mod.mount(ref.current, props)` no `useEffect` e `unmount()` na limpeza. Os dois testes do spike passaram e não houve erro no console. O custo é um segundo React baixado e **executado** pelo navegador e um root React separado: o widget não enxerga contexto nem Suspense da zona, e props novas só chegam via `update()`.

O `shared` ficou por ser a primeira opção do plano e por manter uma única instância de React na página. O risco que fica registrado: o remote é compilado contra o React 19.3.1, mas roda com o canary que o Next embute. Se uma atualização do Next trouxer um canary incompatível, a troca para `mount` é o caminho (o contrato `mount` já está exportado pelos widgets).

## Remote fora do ar ou widget quebrado

Se o manifest ou o chunk do widget não carregam, o `loadRemote` rejeita (com o `:3003` parado: `[ Federation Runtime ]: Failed to get manifest. #RUNTIME-003`), o `RemoteWidget` registra o erro com `console.warn` e mostra `fallback` (ou `<span data-testid="widget-fallback">Widget unavailable</span>`). O resto da página não depende do widget. O segundo teste do spike bloqueia `http://localhost:3003/**` e confere o título e o fallback dentro do `<main>` (o `CartWidget` do header também cai no fallback).

Se o widget carrega mas lança erro ao renderizar, o erro sobe pela árvore React da zona, porque o widget roda nela. Sem tratamento, ele desmontava a página inteira. Por isso o `RemoteWidget` envolve o widget num error boundary (`WidgetErrorBoundary`, um class component com `getDerivedStateFromError`) que mostra o mesmo fallback. O boundary tem `key={name}`, e o estado do `RemoteWidget` guarda o nome que carregou: trocar `name` volta a não renderizar nada até o novo widget chegar, em vez de mostrar o widget anterior (ou o fallback dele) com as props novas. Os testes ficam em `packages/mf-host/src/RemoteWidget.test.tsx` (Vitest + jsdom) e em `e2e/widgets.spec.ts`, que responde `/catalog/api/recommendations` com um corpo sem `products`: o `Recommendations` quebra no render, o fallback aparece e o título do produto e o botão de carrinho continuam na tela.

## Widgets reais

Os widgets chamam as APIs das zonas pela mesma origem do shell (`/account/api/cart`, `/catalog/api/recommendations`), com `credentials: 'same-origin'`. Como rodam dentro da página servida em `localhost:3000`, o cookie `lab_user` vai junto e não há CORS.

| Widget | Props | Dados | Comportamento |
|---|---|---|---|
| `CartWidget` | nenhuma | `GET /account/api/cart` | mostra `Cart` + `Badge` do `@lab/ui` com a soma das quantidades (nome acessível `"1 item in cart"`, `"N items in cart"`), link `<a>` para `/account/orders`. Com 401 (deslogado) não renderiza nada |
| `Recommendations` | `{ excludeId?: number; lang?: 'pt' \| 'en' }` (default `pt`) | `GET /catalog/api/recommendations?lang=<lang>&exclude=<id>` | `<section>` "Recomendados"/"Recommended" com 4 links `<a href>` vindos da API (`/catalog/<lang>/products/<id>`), nomes e preço no idioma da página. A página de produto passa o `lang` do root param |

O mesmo `CartWidget` aparece no header do catálogo e no da conta, e o `e2e/widgets.spec.ts` confere que ele mostra a mesma contagem nas duas zonas.

O widget importa `Badge` e `Price` do `@lab/ui`. O Rsbuild compila o TypeScript e os CSS Modules do pacote; o `sideEffects` do `@lab/ui` faz os componentes que o widget não usa (e o CSS deles) ficarem fora do chunk. Para o `tsc` do widgets enxergar `*.module.css`, `apps/widgets/src/env.d.ts` referencia `@rsbuild/core/types`.

### Evento `lab:cart-changed`

`CustomEvent<{ count: number }>` disparado no `window`:

- pelo `AddToCart` do catálogo, depois de um `POST /account/api/cart` com sucesso, com a contagem do carrinho devolvido;
- pelo `CartWidget`, quando a contagem que ele buscou muda;
- pelo `PlaceOrderButton` da conta, com `count: 0`, depois de um pedido feito (o pedido esvazia o carrinho).

O `CartWidget` refaz o `GET` a cada evento, menos o que ele mesmo acabou de disparar. A contagem do evento não é usada como verdade: ela pode ter saído de uma resposta antiga, e só o `GET` diz o estado atual. O laço fica fechado porque o widget só dispara quando a contagem buscada muda: outro `CartWidget` na página recebe o evento, busca, chega à mesma contagem e não dispara de novo. Respostas que chegam fora de ordem são descartadas (só vale a última requisição).

O nome do evento está repetido em `apps/widgets/src/cart-events.ts` e no `AddToCart`. É um contrato de runtime entre um remote e um host com deploys separados, como uma URL de API, e por isso não virou import entre eles.

### `AddToCart`

Client Component em `apps/catalog/app/catalog/[lang]/products/[id]/AddToCart.tsx`. Faz `POST /account/api/cart` com `{ productId, qty: 1 }`. Com 401 faz navegação dura para `/account/login?next=<caminho atual>`. Com outro erro mostra a mensagem `addToCartFailed`.

O `next` do login da conta é relativo ao `basePath` (`/orders` volta para `/account/orders`), porque o `redirect()` de uma Server Action resolve dentro do `basePath`. Um `next=/catalog/pt/products/5` caía em `/account/catalog/pt/products/5` (404). Agora `login` (`apps/account/app/login/actions.ts`) mantém as validações do `safeNext` e, quando o caminho é do catálogo (`/catalog` seguido de fim, `/`, `?` ou `#`), redireciona para a URL absoluta no shell, `${SHELL_URL}${next}` (`SHELL_URL` com default `http://localhost:3000`). O navegador sai da zona da conta e carrega a página do catálogo. `/` continua significando a home da conta, porque é o default do formulário e do `safeNext`.

### API de recomendações

`GET /catalog/api/recommendations?lang=<lang>&exclude=<id>` (`apps/catalog/app/catalog/api/recommendations/route.ts`) devolve `{ products: { id, name, priceCents, href }[] }` com 4 produtos, nomes no idioma pedido e `href` `/catalog/<lang>/products/<id>`. Usa o `getRecommendedProducts(lang, excludeId)` de `lib/data.ts` (cacheado com a tag `products`), então a mesma invalidação que atualiza o bloco "Relacionados" atualiza o widget. O `getRecommendations` do `@lab/db` ganhou o parâmetro `lang` (default `en`, o comportamento de antes para os blocos "Relacionados" e "Populares"). `lang` ausente vale `pt`; `lang` fora de `pt`/`en` responde 400. `exclude` ausente não exclui nada; `exclude` que não é inteiro não negativo responde 400.

## Remote standalone

`pnpm --filter widgets dev` (ou `start` depois do build) serve `http://localhost:3003/` com os três widgets renderizados por `src/standalone.tsx`. O `server.proxy` do Rsbuild repassa `/account/api` e `/catalog/api` para o shell em `http://localhost:3000`, então com as zonas no ar o `CartWidget` e o `Recommendations` mostram dados reais (o cookie de `localhost` vale para qualquer porta). Com `react`/`react-dom/client` no `shared`, esse entry precisa de uma fronteira assíncrona; sem ela o console mostrava `[ Federation Runtime ]: Invalid loadShareSync function call from runtime #RUNTIME-006 args: {"hostName":"widgets","sharedPkgName":"react-dom/client"}`. A fronteira vem de `experiments: { asyncStartup: true }` no plugin, sem arquivo `bootstrap` separado.

## Diferença para Multi-Zones

| | Multi-Zones | Module Federation |
|---|---|---|
| Unidade | página/rota inteira | componente dentro de uma página |
| Quem junta | o servidor (rewrites do shell) | o navegador, em runtime |
| SSR | sim, cada zona renderiza a sua página | não, o widget aparece depois da hidratação |
| Navegação entre partes | dura (`<a>`) | nenhuma: o widget vive dentro da página da zona |
| Deploy | cada zona tem build e servidor próprios | o remote tem build próprio; o host só conhece a URL do manifest |
| Falha | a rota da zona fora do ar quebra | a página segue e mostra o fallback |

Multi-Zones divide o site por URL; Module Federation reaproveita o mesmo componente (ex.: o carrinho) em várias zonas sem rebuild delas.

## Remote fora do ar em desenvolvimento

`RemoteWidget` registra a falha de carregamento do remote com `console.warn` (a mensagem do erro é mantida). Um remote indisponível é uma condição esperada e tratada: com `console.error`, o overlay do `next dev` aparecia por cima da página mesmo com o fallback já visível. Os erros de renderização do widget, capturados pelo `WidgetErrorBoundary`, seguem sendo erros.

Verificação manual: `pnpm --filter catalog dev` com a :3003 parada, abrindo `/catalog/pt/lab/errors`: sem overlay e com o `widget-fallback` visível.

## Desvios em relação ao plano

- `shared` inclui `react-dom/client` no remote e no host (ver erro #527 acima).
- `experiments: { asyncStartup: true }` no remote, para o entry standalone.
- `@lab/mf-host/src/index.ts` tem `"use client"` e exporta só o `RemoteWidget`; `getFederation` e `MF_STRATEGY` têm entradas próprias (`/runtime`, `/strategy`).
- `react/jsx-runtime` e `react/jsx-dev-runtime` também são compartilhados.
- `RemoteWidget` tem error boundary e volta ao estado de carregamento quando `name` muda.
- O `HelloWidget` usa `useState` para guardar o texto. A saída é a mesma do plano, mas assim o teste do spike falharia se o widget rodasse com outra cópia do React (o hook quebra fora do React que está renderizando); sem hook, um React duplicado passaria despercebido.
