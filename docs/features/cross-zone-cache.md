# Cache entre zonas

## O problema

Cada zona (shell, catalog, account) é um processo Next separado, e cada processo tem o seu próprio cache de dados (`'use cache'`). Uma Server Action na zona `account` que altera o estoque de um produto invalida apenas o cache do processo `account`; o catálogo continua servindo o valor antigo até o `cacheLife` expirar.

## Vocabulário de tags

As tags vivem em `@lab/cache-sync` (`packages/cache-sync/src/tags.ts`) e são a única forma de nomear entradas de cache entre zonas:

| Tag | Uso |
| --- | --- |
| `products` | lista de produtos |
| `product:<id>` | um produto |
| `stock:<id>` | estoque de um produto |
| `user:<id>:profile` / `orders` / `cart` / `notifications` | dados do usuário |

## Invalidação

- Na zona que originou a mudança: `updateTag(tag)` (leitura imediata do próprio dado na mesma requisição).
- Nas outras zonas: `broadcastInvalidation(tags, { from })` faz um `POST` para o endpoint interno de cada zona, exceto a de origem. O endpoint chama `revalidateTag(tag, { expire: 0 })`, que expira a entrada imediatamente.

Endpoints internos (`POST`, header `x-lab-secret`, body `{ "tags": string[] }`):

- shell: `http://localhost:3000/internal/revalidate`
- catalog: `http://localhost:3001/internal/revalidate`
- account: `http://localhost:3002/account/internal/revalidate` (por causa do `basePath`)

Respostas: 401 com segredo errado, 400 com body inválido, 405 para outro método, 200 com `{ "revalidated": [...] }`. O segredo vem de `LAB_INTERNAL_SECRET`, com padrão `lab-dev-secret`.

## Zona fora do ar

`broadcastInvalidation` nunca lança. Usa `Promise.allSettled` com `AbortSignal.timeout(2000)`, devolve `{ zone, ok, error? }` por zona e registra um `console.warn` para cada falha. A ação do usuário conclui normalmente; o aviso para a zona caída é perdido (não há fila nem retry) e o dado dela só se atualiza quando o `cacheLife` expirar.

## Exposição pelo shell

O usuário só acessa `http://localhost:3000`, e o shell tem rewrites para `/account/*`. Por isso o `proxy.ts` do shell responde 404 para `/account/internal/:path*`, para que o endpoint de uma zona não vaze pelo shell.

O endpoint do próprio shell (`/internal/revalidate`) não é bloqueado: ele é o alvo do broadcast quando a origem é catalog ou account. Fica alcançável de fora, mas protegido pelo segredo (401 sem ele). É uma escolha consciente para um projeto de estudo; em produção, o ideal seria uma rede interna ou um listener separado.

## Dependência

O pacote é código TypeScript consumido direto (`exports` aponta para `src`) e entra em `transpilePackages` das três zonas. Não importa `next`: as rotas injetam `revalidateTag` no `createRevalidateHandler`.
