# Flags experimentais do Turbopack: GC, lazy dynamic imports, plugin runtime

## O que é

Três flags em `experimental` da zona `account`:

- `turbopackGc: true`: liga o coletor de lixo do Turbopack, que apaga tasks inalcançáveis do cache persistente e da memória (padrão: nunca coleta). Aceita também `{ minProgressMs, rootTtlMs }` (TTL padrão de raiz: 3 dias).
- `turbopackLazyDynamicImports: true`: em desenvolvimento, o alvo de um `import()` dinâmico do cliente só é compilado na primeira vez que é usado (padrão: `false`).
- `turbopackPluginRuntimeStrategy: 'workerThreads'`: roda o trabalho de Node.js do Turbopack (loaders, Babel, PostCSS) em worker threads em vez de um pool de processos filhos (padrão: `'childProcesses'`).

## Versão

Next 16.4.3. Os três nomes e valores conferem com `config-shared.d.ts`; a opção da conta aceita `'workerThreads' | 'childProcesses' | 'forceWorkerThreads'`. A flag irmã `turbopackLazyDynamicImportsSSR` (alvos do SSR) não foi ligada: fora do pedido.

## Onde no código

- `apps/account/next.config.ts`: as três flags.
- `apps/account/app/components/PlaceOrderButton.tsx`: o `import("canvas-confetti")` dinâmico depois de um pedido bem-sucedido, que dá ao lazy import um alvo real. `canvas-confetti` 1.9.4 (e `@types/canvas-confetti` 1.9.0) estão fixados na conta.
- `e2e/confetti.spec.ts`: prova que o chunk do confete não é carregado na abertura da página e chega depois do clique em "Place order".

## Como observar

### Fallback de worker threads no Node 26 (linha real)

Vale para `next dev`, `next build` e `next experimental-analyze` da conta; no Node 26.12.1 a flag é recusada e o Next volta para child processes:

```
⚠ `experimental.turbopackPluginRuntimeStrategy = 'workerThreads'` is disabled on Node.js 26.12.1.
A Node.js worker-thread teardown bug can abort the process when a native addon, such as fsevents, has a live Node-API threadsafe function as a worker exits.
See https://github.com/nodejs/node/issues/65100.
Falling back to 'childProcesses'. To override at your own risk, use 'forceWorkerThreads'.
```

Ou seja, neste ambiente a flag é configurada mas não tem efeito; a lista de experimentos continua mostrando `· turbopackPluginRuntimeStrategy: "workerThreads"`, com ponto em vez de `✓` (valor configurado, mas a opção efetiva é outra). `forceWorkerThreads` ignora o fallback e pode derrubar o processo; não foi usado.

### Lista de experimentos

```
account:build: - Experiments (use with caution):
account:build:   ✓ exposeTestingApiInProductionBuild
account:build:   · serverActions
account:build:   ✓ turbopackGc
account:build:   ✓ turbopackLazyDynamicImports
account:build:   · turbopackPluginRuntimeStrategy: "workerThreads"
account:build:   ✓ useOffline
```

### Lazy dynamic import

- Em produção o `import()` já vira chunk separado, com ou sem a flag: depois do build, `grep -l confetti apps/account/.next/static/chunks/*.js` devolve só `41q87uv_0bu1l.js` (10 435 bytes). O `e2e/confetti.spec.ts` verifica no navegador que nenhum chunk carregado antes do clique contém "confetti".
- No Bundle Analyzer (ver `bundle-analyzer.md`), o módulo `canvas-confetti/dist/confetti.module.mjs` aparece como dependência `async` de `PlaceOrderButton.tsx [app-client]`, enquanto Button, `next/offline` e React entram como `sync`.
- O efeito da flag em si (compilar o alvo só no primeiro uso, em `next dev`) não imprime nada no log. Para ver: abra a aba Network em `/account/orders` com `pnpm --filter account dev`, faça um pedido e observe o chunk do confete ser pedido (e compilado) só nesse momento. Não capturei esse tempo de compilação.

### GC

`turbopackGc` não imprime nada. Ele atua no cache persistente de `next dev` (`.next/dev/cache`): com ele, tasks sem raiz há mais de `rootTtlMs` (3 dias) são apagadas, então o efeito só aparece com uso prolongado (tamanho do cache estável em vez de crescente). Não capturei esse efeito.
