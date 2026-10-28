# Overlay de erros do `next dev` (`Error.cause` e diff de hidratação)

## O que é

Em desenvolvimento, o overlay do Next mostra a cadeia de `Error.cause` (cada causa vira um bloco "Caused by" com seu próprio stack e trecho de código) e, em erro de hidratação, um diff cliente/servidor. Só existe em `next dev`: em produção a página-laboratório mostra apenas um aviso.

## Versão

Lab em Next 16.4.3 / React 19.3.1.

## Onde no código

`apps/catalog/app/catalog/[lang]/lab/errors/` (rota `/catalog/pt/lab/errors` e `/catalog/en/lab/errors`):

- `page.tsx`: em produção (`NODE_ENV === 'production'`) renderiza o aviso; em dev renderiza os dois botões. Rótulos via `t()` (pt/en).
- `ErrorLab.tsx`: botão 1 muda estado e lança `Error("Catalog page failed")` com `cause` encadeada em 3 níveis (`Could not load product list` e `Database connection refused`). Botão 2 recarrega a página com `?mismatch=1`, porque a hidratação só falha na renderização inicial; um componente montado depois do clique não geraria diff.
- `HydrationMismatch.tsx`: client component que renderiza `Date.now()`; servidor e cliente produzem valores diferentes.

## O que o overlay mostrou (conferido manualmente com `pnpm --filter catalog dev`)

Botão "Trigger error with chained cause" (texto do overlay):

```
Runtime Error
Catalog page failed
app/catalog/[lang]/lab/errors/ErrorLab.tsx (11:9) @ failWithCauseChain
> 11 |   throw new Error("Catalog page failed", { cause: middle });
Call Stack 16 (Show 13 ignore-listed frame(s))
failWithCauseChain ErrorLab.tsx (11:9) / ErrorLab ErrorLab.tsx (17:15) / ErrorLabPage page.tsx (24:7)

Caused by: Error
Could not load product list
app/catalog/[lang]/lab/errors/ErrorLab.tsx (10:18) @ failWithCauseChain
> 10 |   const middle = new Error("Could not load product list", { cause: root });

Caused by: Error
Database connection refused
app/catalog/[lang]/lab/errors/ErrorLab.tsx (9:16) @ failWithCauseChain
> 9 |   const root = new Error("Database connection refused");
```

Os três níveis aparecem, cada um com o seu frame de código.

Botão "Trigger hydration mismatch":

```
Recoverable Error
Hydration failed because the server rendered text didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:
- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.
See more info here: https://nextjs.org/docs/messages/react-hydration-error

client/server diff
+ Client
- Server
<HydrationMismatch>
  <p>
+   1793129012990
-   1793129012682
app/catalog/[lang]/lab/errors/HydrationMismatch.tsx (4:10) @ HydrationMismatch
> 4 |   return <p>Rendered at {Date.now()}</p>;
```

## Cobertura automatizada

`e2e/error-lab.spec.ts` roda em produção e confere o título e o aviso em pt e en, a ausência dos botões e que `?mismatch=1` não renderiza o componente com `Date.now()`.

## Nota

A verificação é manual de propósito: o overlay só existe em dev e não há como o Playwright de produção (`pnpm e2e`) vê-lo.
