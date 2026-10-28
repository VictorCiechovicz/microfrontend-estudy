# `refresh()`: re-renderizar a página depois de uma Server Action

## O que é

`refresh()` (de `next/cache`) pede ao router do cliente que busque de novo a página atual quando a Server Action terminar. Não mexe em nenhum cache de dados: o que estiver em `'use cache'` volta igual. Serve para dados que **não** são cacheados e que mudaram por causa da action.

Sem `refresh()`, `updateTag`, `revalidatePath`/`revalidateTag` ou escrita de cookie, a resposta de uma Server Action não traz árvore nova e a tela continua como estava.

## Versão

Next 16.4.3. Assinatura instalada: `refresh(): void`. Só pode ser chamado dentro de Server Action; em Route Handler lança erro.

## Onde no código

- `apps/account/app/components/NotificationBadge.tsx`: badge de não lidas no header da conta. Faz `await connection()`, lê a sessão e chama `unreadCount(id)` sem cache, a cada requisição, dentro de `<Suspense>` no layout.
- `apps/account/app/notifications/page.tsx`: lista sem cache (também atrás de `connection()`), com um botão "Mark as read" por notificação não lida (`markReadAction.bind(null, id)`).
- `apps/account/app/notifications/actions.ts` › `markReadAction(id)`: `markNotificationRead`, `refresh()` e broadcast de `user:<id>:notifications`.

Na conta, quem atualiza o badge é o `refresh()`: a contagem não está em cache, então basta re-renderizar. O broadcast continua necessário para o catálogo, onde o badge é cacheado com `cacheTag(tags.userNotifications(id))` e só o `revalidateTag` do endpoint interno o derruba.

## `refresh()` vs `updateTag()`

| | `updateTag(tag)` | `refresh()` |
| --- | --- | --- |
| Cache de dados | expira as entradas da tag | não toca |
| Re-render da página | sim | sim |
| Uso aqui | perfil, pedidos, carrinho (cacheados) | badge e lista de notificações (sem cache) |

Trocar um pelo outro quebra os dois testes: `refresh()` no perfil re-renderiza com o nome velho do cache (ver `update-tag.md`); tirar o `refresh()` de `markReadAction` deixa o badge parado.

## Como observar

1. `pnpm prod`, entre como Ana e abra `http://localhost:3000/account/notifications`. O header mostra o badge com "1" (a notificação de boas-vindas do seed).
2. Clique em "Mark as read": o badge vira "0" e a notificação passa a mostrar "(read)", sem recarregar.
3. `e2e/account.spec.ts` › "marking notification read updates header badge (refresh)". O teste lê o número atual e espera um a menos, para não depender de outros testes que criam notificações (um pedido gera "Order #N placed"). Com o banco recém-resetado, é 1 → 0.
4. Para ver falhar: apague o `refresh()` de `markReadAction`. A action roda, o banco muda, mas a tela não: o teste falha com `Expected: "0"`, `Received: "1"` (conferido).
