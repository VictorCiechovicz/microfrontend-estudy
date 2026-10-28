# Module Federation

O remote `widgets` (`apps/widgets`, porta 3003) é um app Rsbuild 2.2.14 com o `@module-federation/rsbuild-plugin` 2.9.2. As zonas Next não são buildadas com Module Federation: elas carregam os widgets **só no navegador**, em tempo de execução, pelo pacote `@lab/mf-host` (runtime do `@module-federation/enhanced` 2.9.2).

| Peça | Onde | Papel |
|---|---|---|
| Remote `widgets` | `apps/widgets/rsbuild.config.ts` | expõe `./HelloWidget`, publica `http://localhost:3003/mf-manifest.json` |
| `getFederation()` | `packages/mf-host/src/runtime.ts` | instância única de `createInstance`, registra o remote e o React do host no `shared` |
| `<RemoteWidget>` | `packages/mf-host/src/RemoteWidget.tsx` | Client Component: `loadRemote('widgets/<name>')` no `useEffect`, renderiza o `default` ou o fallback |
| Uso | `apps/catalog/app/catalog/[lang]/page.tsx` | `<RemoteWidget name="HelloWidget" />` dentro de um Server Component |

A URL do remote vem de `NEXT_PUBLIC_WIDGETS_URL`, com default `http://localhost:3003` no código.

## Por que o Module Federation fica fora do Next

- O App Router do Next 16 compila com Turbopack, que não tem plugin de Module Federation. Não dá para declarar `remotes`/`exposes` no build de uma zona.
- O `@module-federation/nextjs-mf` só funciona com o Pages Router e webpack, e está em modo manutenção. Trocar o bundler de uma zona por webpack ou usar iframe estão fora das regras do lab.
- Por isso a federação acontece só em runtime: o Next empacota o `@module-federation/enhanced/runtime` como uma dependência qualquer, e o `RemoteWidget` busca o manifest, o `remoteEntry` e o chunk do widget depois da hidratação. No servidor (SSR/RSC) o widget não existe: o HTML da zona sai sem ele.

O entry `@lab/mf-host` é marcado com `"use client"`. Sem isso, o Server Component que importa `RemoteWidget` arrastava `runtime.ts` (e `react-dom/client`) para o grafo do servidor e o `next build` falhava.

## Estratégia escolhida: `shared` (`MF_STRATEGY = 'shared'`)

O host registra o React que o Next empacotou (`lib: () => React`, `version: React.version`, `singleton: true`, `requiredVersion: false`) e o remote declara os mesmos pacotes como `singleton`. O widget roda dentro da árvore React da zona: hooks, contexto e Suspense são os do host, e o React 19.3.1 do remote não é executado. Ele ainda é baixado: o manifest lista os chunks dos `shared` como assets síncronos (`react-dom/client` sozinho tem ~207 kB, ~65 kB gzip) e o runtime os busca junto com o widget, mas não os avalia. Declarar `import: false` nos `shared` do remote evitaria o download, ao custo de o remote não ter React próprio para o modo standalone.

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

## Remote fora do ar

Se o manifest ou o chunk do widget não carregam, o `loadRemote` rejeita (com o `:3003` parado: `[ Federation Runtime ]: Failed to get manifest. #RUNTIME-003`), o `RemoteWidget` registra o erro com `console.error` e mostra `fallback` (ou `<span data-testid="widget-fallback">Widget unavailable</span>`). O resto da página não depende do widget. O segundo teste do spike bloqueia `http://localhost:3003/**` e confere o título "Catalog" e o fallback.

## Remote standalone

`pnpm --filter widgets dev` (ou `start` depois do build) serve `http://localhost:3003/` com o `HelloWidget` renderizado por `src/standalone.tsx`. Com `react`/`react-dom/client` no `shared`, esse entry precisa de uma fronteira assíncrona; sem ela o console mostrava `[ Federation Runtime ]: Invalid loadShareSync function call from runtime #RUNTIME-006 args: {"hostName":"widgets","sharedPkgName":"react-dom/client"}`. A fronteira vem de `experiments: { asyncStartup: true }` no plugin, sem arquivo `bootstrap` separado.

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

## Desvios em relação ao plano

- `shared` inclui `react-dom/client` no remote e no host (ver erro #527 acima).
- `experiments: { asyncStartup: true }` no remote, para o entry standalone.
- `@lab/mf-host/src/index.ts` tem `"use client"`.
- O `HelloWidget` usa `useState` para guardar o texto. A saída é a mesma do plano, mas assim o teste do spike falharia se o widget rodasse com outra cópia do React (o hook quebra fora do React que está renderizando); sem hook, um React duplicado passaria despercebido.
