# TypeScript 7 (compilador nativo) no build do Next

## O que é

O repositório usa `typescript@7.0.2`, o compilador nativo (port em Go). O `next build` roda o type-check do projeto na etapa "Running TypeScript" e `pnpm typecheck` roda `tsc --noEmit` por app.

## Versão

Next 16.4.3 com TypeScript 7.0.2 (fixado no `package.json` da raiz e dos apps). Nenhuma flag do Next é necessária.

## Onde no código

- `package.json` (raiz) e `apps/*/package.json`: `"typescript": "7.0.2"`.
- `packages/tsconfig/`: configs compartilhadas.

## Como observar

O log do build imprime o tempo de cada type-check. Captura real de `EXPOSE_TESTING_API=1 pnpm build` (Node 26.12.1):

```
shell:build:   Running TypeScript ...
shell:build:   Finished TypeScript in 437ms ...
catalog:build:   Finished TypeScript in 339ms ...
account:build:   Finished TypeScript in 331ms ...
```

Compare com a compilação do Turbopack na mesma execução (`Compiled successfully in 600ms` no shell, `1744ms` no catálogo, `1866ms` na conta): o type-check custa uma fração disso. Os três apps compilam em paralelo, então os números têm ruído; são ordem de grandeza, não benchmark. Não rodei o mesmo projeto com TypeScript 5 para ter a razão exata.
