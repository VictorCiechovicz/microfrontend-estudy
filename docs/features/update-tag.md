# `updateTag`: ler o que acabou de escrever

## O que é

`updateTag(tag)` (de `next/cache`) expira na hora as entradas de `'use cache'` marcadas com a tag, e a re-renderização que a própria Server Action devolve já lê o dado novo. É o caso "read-your-own-writes": o usuário salva e vê o resultado sem recarregar e sem receber o valor velho do cache.

## Versão

Next 16.4.3. Assinatura instalada: `updateTag(tag: string): undefined`. Só funciona dentro de Server Action; em Route Handler é preciso usar `revalidateTag(tag, profile)` (a rota `/account/api/cart` usa `revalidateTag(tag, { expire: 0 })`, que tem o mesmo efeito imediato).

## Onde no código

- `apps/account/lib/data.ts`: leituras cacheadas da conta. Cada função recebe o `userId` como argumento e nunca lê cookie dentro do escopo cacheado:
  - `getProfile(userId)`: tag `user:<id>:profile`.
  - `getOrders(userId)` e `getOrder(userId, orderId)`: tag `user:<id>:orders`.
  - `getCartLines(userId)`: tag `user:<id>:cart`.
- `apps/account/app/components/UserSlot.tsx`: o nome no header vem de `getProfile(id)`.
- `apps/account/app/profile/actions.ts` › `updateProfileAction(formData)`: `updateProfile`, `updateTag(tags.userProfile(id))` e broadcast da mesma tag para shell e catálogo.
- `apps/account/app/orders/actions.ts` › `placeOrderAction()`: `placeOrder`, `updateTag` de `userOrders`, `userCart` e `userNotifications`, e broadcast de `stock:<id>` de cada linha, `userNotifications` e `userCart`. Com carrinho vazio devolve `{ error: 'Cart is empty' }` sem invalidar nada.

## Desvio: cópia do registro do SQLite

`getUser` devolve a linha do `node:sqlite`, que é um objeto sem protótipo. O resultado de uma função `'use cache'` é serializado como RSC, e o React recusa esse objeto ("Only plain objects … Classes or null prototypes are not supported"), quebrando todas as páginas da conta. `getProfile` devolve uma cópia `{ id, name }`. As outras leituras (`listOrders`, `getCart`) já montam objetos comuns.

## Server Action sem sessão

O `proxy.ts` da conta redireciona requisições sem cookie para `/account/login?next=`. Para uma Server Action isso dava errado: o `POST` com o header `next-action` recebia um 307, o `fetch` do cliente seguia o redirect e reenviava o `POST` para a página de login, que não conhece a action, e a tela caía no erro do Next (`<html id="__next_error__">`). O proxy agora deixa passar `POST` com `next-action`. Quem decide é a própria action: todas chamam `requireUserId()`, que faz `redirect('/login')`, e o Next devolve esse redirect no protocolo de action, que o cliente segue para `/account/login`. Vale para cookie ausente e para cookie de usuário inexistente (`999`).

## Log de Server Functions no `next dev`

No `next dev` (16.4.3) cada invocação aparece no terminal abaixo da requisição, com nome, argumentos, tempo da função e arquivo (`logging.serverFunctions`, ligado por padrão em dev). Trecho real de `pnpm --filter account dev`, chamando direto `http://localhost:3002/account` com só a conta no ar (por isso os avisos do broadcast para shell e catálogo):

```text
 POST /api/cart 200 in 12ms (next.js: 0.6ms, application-code: 11ms)
 GET /orders 200 in 49ms (next.js: 4ms, proxy.ts: 1.6ms, application-code: 43ms)
cache-sync: broadcast to shell failed: fetch failed
cache-sync: broadcast to catalog failed: fetch failed
 POST /orders 200 in 450ms (next.js: 4ms, proxy.ts: 4ms, application-code: 441ms)
  └─ ƒ placeOrderAction() in 6ms app/orders/actions.ts
 POST /orders 200 in 10ms (next.js: 1.8ms, proxy.ts: 3ms, application-code: 5ms)
  └─ ƒ placeOrderAction() in 1ms app/orders/actions.ts
 POST /profile 200 in 28ms (next.js: 6ms, proxy.ts: 1.8ms, application-code: 20ms)
  └─ ƒ updateProfileAction({}) in 4ms app/profile/actions.ts
 POST /notifications 200 in 27ms (next.js: 6ms, proxy.ts: 1.8ms, application-code: 20ms)
  └─ ƒ markReadAction(5) in 4ms app/notifications/actions.ts
```

O primeiro `placeOrderAction` criou o pedido: a função levou 6 ms, mas o `POST` levou 450 ms porque a resposta já traz a página re-renderizada, e `getOrders` tem 400 ms de latência simulada (`withLatency`) e acabou de ser expirado pelo `updateTag`. O segundo achou o carrinho vazio e não invalidou nada. O `FormData` aparece como `{}`; argumentos simples aparecem pelo valor (`markReadAction(5)`, com o id vindo do `.bind`).

## Como observar

1. `pnpm prod`, entre como Ana em `http://localhost:3000/account/login` e abra `/account/profile`.
2. Troque o nome e clique em "Save": o header mostra o nome novo na mesma hora, sem recarregar.
3. `e2e/account.spec.ts` › "profile edit shows new name immediately (updateTag)". O `afterAll` do arquivo devolve o nome "Ana".
4. Para ver falhar: troque `updateTag(tags.userProfile(userId))` por `refresh()` em `profile/actions.ts`. A página é re-renderizada, mas `getProfile` devolve o valor do cache e o header continua "Ana" (conferido: `Expected: "Ana Lab"`, `Received: "Ana"`).
