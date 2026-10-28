# Parallel route + intercepting route: detalhe do pedido como modal

## O que é

Um slot `@modal` no layout raiz da conta é uma segunda árvore de rotas renderizada ao lado de `children`. Dentro dele, `(.)orders/[id]` **intercepta** `/orders/[id]`: numa navegação no cliente a partir da lista, o detalhe abre como modal por cima de "Orders", com a URL `/account/orders/<id>`. Numa carga completa da mesma URL (reload, link colado), não há interceptação: `children` renderiza a página `orders/[id]` inteira e o slot cai no `default.tsx`.

## Versão

Next 16.4.3. Todo slot nomeado precisa de `default.tsx` (antes do 16, o slot sem correspondência virava 404 em tempo de execução). Conferido: sem `@modal/default.tsx`, o `next build` da conta falha com "Every page must be part of at least one complete route. Add matching pages or default files for the sibling parallel route slots, or remove the unreachable pages.", listando todas as páginas da zona. Aqui `@modal/default.tsx` devolve `null`. O `basePath: '/account'` não muda nada nas convenções: os caminhos de `app/` continuam sem o prefixo.

## Onde no código

- `apps/account/app/layout.tsx`: recebe `{ children, modal }` e renderiza `{modal}` depois de `{children}`.
- `apps/account/app/@modal/default.tsx`: `null` quando nenhuma rota do slot corresponde.
- `apps/account/app/@modal/[...catchAll]/page.tsx`: `null` para qualquer outra rota da conta. Numa navegação suave o slot guarda o último estado ativo; sem este arquivo, uma navegação suave para outra página da conta (um `<Link>` qualquer) mantinha o modal aberto por cima da página nova (conferido indo para `/account/notifications`: o teste falha com `getByRole('dialog')` `Expected: 0`, `Received: 1`).
- `apps/account/app/@modal/(.)orders/[id]/page.tsx`: `<Modal label="Order detail">` com `<OrderDetail heading="h2">` dentro de `<Suspense>`.
- `apps/account/app/orders/[id]/page.tsx`: a página normal, com `<OrderDetail heading="h1">`.
- `apps/account/app/components/OrderDetail.tsx`: Server Component compartilhado. Lê `params`, a sessão (`requireUserId`) e `getOrder(userId, id)` (`'use cache'`, tag `user:<id>:orders`); `notFound()` para id inválido ou de outro usuário.
- `apps/account/app/components/Modal.tsx`: Client Component com `role="dialog"`; "Close" chama `router.back()`.
- `apps/account/app/orders/page.tsx`: cada linha (`data-testid="order-row"`) tem `<Link href="/orders/<id>">`.

## Pelo shell

O usuário entra por `http://localhost:3000`, e o shell repassa `/account/*` por rewrite. A interceptação é decidida pelo servidor da conta a partir dos headers da requisição RSC (de onde o cliente está navegando), e o rewrite do shell repassa os headers: o teste e2e roda pelo shell e o modal abre normalmente.

## Como observar

1. `pnpm prod`, entre como Ana, ponha algo no carrinho (botão do catálogo na Task 11, ou `POST /account/api/cart`) e faça um pedido em `/account/orders`.
2. Clique em "Order #N": abre o modal, o `<h1>` "Orders" continua atrás e a URL muda para `/account/orders/N`.
3. O fundo escuro do modal cobre a página, então pela tela só se sai dele por "Close" ou pelo voltar. O teste dispara o clique direto no `<Link>` do badge do header (`dispatchEvent("click")`) para exercitar uma navegação suave com o modal aberto: a URL vira `/account/notifications` e o modal fecha por causa do `[...catchAll]`; voltar no navegador reabre o modal.
4. Recarregue: some o modal, e a página mostra `<h1>Order #N</h1>`. "Close" (ou o voltar do navegador) fecha o modal.
5. `e2e/account.spec.ts` › "order detail opens as modal from list and as page on reload".
