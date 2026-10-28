# `--inspect`: depurar o código de servidor

## O que é

`next dev --inspect` e `next start --inspect` abrem o inspetor do Node.js no processo do servidor Next, para depurar código de servidor (Server Components, Server Actions, Route Handlers) com Chrome DevTools (`chrome://inspect`) ou VS Code.

## Versão

Next 16.4.3. `next dev --help` lista `--inspect [[host:]port]`; sem valor, a porta é 9229 (por isso o shell usa o padrão explícito).

## Onde no código

Em `apps/shell`, `apps/catalog` e `apps/account`, scripts `dev:inspect` e `start:inspect` (mesma porta HTTP do `dev`/`start` de cada zona, mais `--inspect`). Desvio do brief: o brief dava `next dev --inspect` sem porta; mantive `-p 3000/3001/3002` para a zona continuar no lugar certo atrás do shell. Cada zona tem a sua porta de inspetor (`--inspect=<porta>`), para as três poderem rodar com inspetor ao mesmo tempo: shell 9229, catalog 9230, account 9231.

## Como observar

`pnpm --filter account dev:inspect` imprime:

```
$ next dev -p 3002 --inspect=9231
Debugger listening on ws://127.0.0.1:9231/2f3d074d-ecc4-4210-8619-a0e308c1e1ac
For help, see: https://nodejs.org/learn/getting-started/debugging
▲ Next.js 16.4.3 (Turbopack)
- Local:         http://localhost:3002
- Debugger port: 9231
```

`curl localhost:9231/json/list` devolve o alvo (`type: "node"`, `title` apontando para `next/dist/server/lib/start-server.js`). Em `chrome://inspect`, "Remote Target" mostra o mesmo alvo; um `debugger;` numa Server Action pausa ali.
