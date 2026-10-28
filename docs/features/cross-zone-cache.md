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

## Os três casos (e2e `e2e/coherence.spec.ts`)

```
            account (:3002)                           catalog (:3001)
 placeOrderAction ─ updateTag user:<id>:orders|cart|notifications
        │
        └─ broadcast stock:<id>…, user:<id>:notifications, user:<id>:cart ──► revalidateTag(expire 0)
                                                                              StockBlock / badge do header
 markReadAction ─ refresh()
        │
        └─ broadcast user:<id>:notifications ─────────────────────────────► revalidateTag(expire 0)
                                                                              badge do header
 revalidateTag(expire 0) ◄── broadcast product:<id>, products ─────────── setPriceAction
 carrinho em /account/orders                                               revalidateTag(product:<id>, 'max')
                                                                           revalidateTag(products, 'max')
```

O shell também recebe cada broadcast (é zona-alvo de toda origem), mas hoje não guarda nenhum dado com essas tags.

| Caso | Quem muda | Tag | Quem lê em cache |
| --- | --- | --- | --- |
| Compra na conta → estoque no catálogo | `placeOrderAction` (account) | `stock:<id>` | `getProductStock` no `StockBlock` (`cacheLife('minutes')`) |
| Preço no catálogo → total do carrinho na conta | `setPriceAction` (catalog, `/catalog/<lang>/admin`) | `product:<id>`, `products` | `getCartLines` (account) |
| Notificação lida na conta → badge no header do catálogo | `markReadAction` (account) | `user:<id>:notifications` | `getUnreadCount` no `NotificationBadge` do catálogo (`cacheLife('hours')`) |

Detalhes:

- **Carrinho marcado por produto.** `getCartLines` chama `cacheTag(user:<id>:cart)` e, depois de ler as linhas, `cacheTag(product:<id>)` para cada produto do carrinho. O preço da linha vem do `JOIN` com `products` na leitura, então basta expirar a entrada para o total refletir o preço novo. As linhas de **pedido** não recebem `product:<id>`: elas guardam o preço do momento da compra (`order_lines.price_cents`) e não devem mudar quando o preço muda.
- **Badge no catálogo.** O cookie `lab_user` é lido fora da função cacheada; o id do usuário entra como argumento de `getUnreadCount(userId)`, que faz `cacheTag(user:<id>:notifications)`. O link do badge é um `<a>` para `/account/notifications` (outra zona).
- **Admin de preço.** `setPriceAction(formData)` exige sessão (sem cookie válido: `redirect` para `/account/login?next=/catalog/<lang>/admin`; a página nem mostra o formulário). `productId` precisa ser inteiro positivo de um produto existente e `priceCents` inteiro entre 1 e 10.000.000; fora disso a ação devolve `Unknown product` / `Invalid price`, nunca 500. O `lang` do `next` vem de um campo oculto do formulário, porque `next/root-params` não funciona em Server Actions no 16.4.3.

Mutation check (cada teste falha sem o seu mecanismo; build e2e com a mudança, `pnpm e2e e2e/coherence.spec.ts`):

| Removido | Teste que falha | Valor observado |
| --- | --- | --- |
| `stock:<id>` do broadcast de `placeOrderAction` | estoque | `5 em estoque` em vez de `3 em estoque` |
| broadcast de `setPriceAction` | total do carrinho | `Total R$ 34,00` em vez de `R$ 46,90` |
| `cacheTag(product:<id>)` em `getCartLines` | total do carrinho | `Total R$ 34,00` |
| broadcast de `markReadAction` | badge | `2` em vez de `0` |
| `revalidateTag(product:<id>, 'max')` local | SWR | `R$ 16,00` por 15 s |

## Stale-while-revalidate no catálogo

Na zona de origem, `setPriceAction` usa `revalidateTag(tag, 'max')` para `product:<id>` **e** para `products` (a lista só tem a tag `products`; sem isso a lista ficaria com o preço antigo até o `cacheLife`). Com `'max'` a entrada só é marcada como velha: a próxima requisição recebe o conteúdo antigo e dispara a regeneração em segundo plano. Escolhemos `'max'` também para `products` para que a lista e o detalhe tenham a mesma semântica no catálogo. Nas outras zonas o broadcast continua com `{ expire: 0 }` (o endpoint interno não sabe se o leitor tolera conteúdo velho, e o caso do carrinho não tolera).

Medição (build de produção, `pnpm --filter <zona> start`, detalhe `/catalog/pt/products/6` e lista `/catalog/pt` lidos alternadamente logo depois de mudar o preço de R$ 16,00 para R$ 19,99):

```
warm detail R$ 16,00 list R$ 16,00
detail #1 R$ 16,00 list R$ 16,00
detail #2 R$ 16,00 list R$ 19,99
detail #3 R$ 19,99 list R$ 19,99
```

Ou seja, "velho uma vez" é uma simplificação: o conteúdo velho é servido enquanto a regeneração disparada pela primeira requisição não termina, então duas requisições seguidas podem ver o preço antigo. O teste e2e registra o que a primeira visita mostrou (anotação `first visit after setPrice`) e só afirma o valor final, com `expect.poll` (até 15 s). Em três execuções seguidas do spec (banco e cache de rota zerados a cada uma), a primeira visita mostrou `R$ 16,00`, o preço antigo, nas três.

## Resultado com uma zona parada (execução manual)

Build de produção, quatro servidores com `pnpm --filter <zona> start`, Bruno (`lab_user=2`) com o produto 7 no carrinho, `/account/orders` aquecido, preço mudado em `/catalog/pt/admin` com a conta indisponível de três formas:

| Como a conta ficou indisponível | Linha no log do catálogo | A ação no catálogo | `/account/orders` depois |
| --- | --- | --- | --- |
| `kill -STOP` (processo congelado) | `cache-sync: broadcast to account failed: The operation was aborted due to timeout` | conclui após ~2 s (timeout) | **fresco** após `kill -CONT`: o `POST` ficou na fila do socket e foi processado quando o processo voltou |
| `kill` (processo morto) e reinício | `cache-sync: broadcast to account failed: fetch failed` | conclui na hora | **fresco** após reiniciar: o cache de `'use cache'` fica em memória e morre com o processo |
| segredo diferente (`LAB_INTERNAL_SECRET=rotated` só na conta) | `cache-sync: broadcast to account failed: HTTP 401` | conclui na hora | **velho** (`R$ 26,00` com o banco em `R$ 27,00`) até o `cacheLife` padrão de `getCartLines` (revalidate de 15 min) |

O aviso perdido só deixa a zona com dado velho quando ela continua de pé com o cache aquecido (terceira linha: falha de rede/segredo, não queda). Uma zona que cai perde o cache em memória junto; o que sobrevive ao reinício é o cache de rota em disco (`.next/server/route-cache`), que os scripts `e2e`/`prod` apagam antes de subir.

## Exposição pelo shell

O usuário só acessa `http://localhost:3000`, e o shell tem rewrites para `/account/*`. Por isso o `proxy.ts` do shell responde 404 para `/account/internal/:path*`, para que o endpoint de uma zona não vaze pelo shell.

O endpoint do próprio shell (`/internal/revalidate`) não é bloqueado: ele é o alvo do broadcast quando a origem é catalog ou account. Fica alcançável de fora, mas protegido pelo segredo (401 sem ele). É uma escolha consciente para um projeto de estudo; em produção, o ideal seria uma rede interna ou um listener separado.

## Dependência

O pacote é código TypeScript consumido direto (`exports` aponta para `src`) e entra em `transpilePackages` das três zonas. Não importa `next`: as rotas injetam `revalidateTag` no `createRevalidateHandler`.
