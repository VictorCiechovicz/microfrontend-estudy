# `useOffline`: pedido feito sem rede conclui quando a rede volta

## O que é

Com `experimental.useOffline`, o router do Next detecta queda de rede (evento `offline` do navegador ou `fetch` de navegação/prefetch/Server Action que falha) e, em vez de lançar erro, **segura** a requisição e a repete quando um `HEAD` de checagem volta a responder. O hook `useOffline()` (de `next/offline`) devolve `true` enquanto isso. Para uma Server Action, o efeito é que o `await` da action simplesmente demora: a transição fica pendente até a rede voltar e então resolve com a resposta do servidor, sem `try/catch` nem retry no componente.

## Versão

Next 16.4.3, experimental. Config: `experimental: { useOffline: true }` (o build lista "✓ useOffline" entre os experimentos). Sem a flag, o hook sempre devolve `false` e a action offline rejeita com erro de `fetch`. O hook devolve `false` no servidor e até a hidratação.

A checagem de conectividade é um `HEAD` na URL atual com header RSC, cancelado em 200 ms; com espera de 500 ms, 1 s, 2 s e depois 3 s entre tentativas (o evento `online` do navegador antecipa a próxima). A doc instalada avisa que só vale para navegação suave e actions da página atual: recarregar sem rede continua falhando, e testar em `next dev` não é confiável. O teste roda no build de produção.

## Onde no código

- `apps/account/next.config.ts`: `experimental.useOffline: true`.
- `apps/account/app/components/OfflineBanner.tsx`: Client Component no layout raiz; com `useOffline()` verdadeiro mostra `role="status"` "You are offline. Pending requests will retry once you are back online."
- `apps/account/app/components/PlaceOrderButton.tsx`: `useTransition` + `useOffline`. O rótulo é "Place order"; pendente, "Placing order…"; pendente e offline, "Placing order (offline, will retry)…". O resultado da action vira um `role="status"` ("Order #N placed" ou "Cart is empty"); se a action lançar, o botão mostra "Could not place the order. Try again." em vez de cair na página de erro.
- `apps/account/app/orders/page.tsx`: o botão fica na seção "Cart", acima do histórico.
- `apps/account/app/api/cart/route.ts`: `GET`/`POST`/`DELETE /account/api/cart`, usado pelo teste para pôr o produto 8 no carrinho (ver abaixo).

## API do carrinho

Criada nesta tarefa porque o teste offline precisa encher o carrinho; o catálogo e o widget consomem na Task 11.

- `GET /account/api/cart` → `{ lines: CartLine[]; totalCents: number }`.
- `POST` com `{ productId, qty }` (`productId` inteiro positivo de produto existente, `qty` inteiro de 1 a 99) → mesmo formato. Cada linha do carrinho fica limitada a 99 unidades no próprio SQL de `addToCart` (`MIN(qty + excluded.qty, 99)`, constante `MAX_LINE_QTY` de `@lab/db`), para qualquer chamador. Sem esse limite, dois `POST` com `qty` = `Number.MAX_SAFE_INTEGER` estouravam o inteiro do SQLite e toda leitura do carrinho passava a lançar no `node:sqlite` ("Value is too large to be represented as a JavaScript number"), virando 500 permanente.
- `DELETE ?productId=` → mesmo formato.
- Sem sessão válida (sem cookie, cookie malformado ou usuário inexistente): **401** `{ error: 'unauthenticated' }`, nunca redirect (o `proxy.ts` da conta não cobre `/api/*`).
- Entrada inválida (JSON quebrado, id/qty não inteiro ou ≤ 0, `qty` > 99, produto inexistente): **400** `{ error }`.
- `POST` e `DELETE` chamam `revalidateTag(tags.userCart(id), { expire: 0 })` e `broadcastInvalidation([tags.userCart(id)], { from: 'account' })`.

## Como observar

1. `pnpm prod`, entre como Ana, ponha um produto no carrinho e abra `http://localhost:3000/account/orders`.
2. DevTools › Network › **Offline**. Clique em "Place order": aparecem o banner e "Placing order (offline, will retry)…".
3. Volte para **No throttling**: em até ~3 s a action é reenviada, o pedido entra no histórico, o carrinho esvazia e o banner some.
4. `e2e/account.spec.ts` › "place order while offline completes when back online" (`context.setOffline(true/false)` do Playwright): confere o rótulo, o banner, uma linha a mais no histórico e o banner sumindo. Usa o produto 8, que é da conta (os outros specs não dependem do estoque dele).
