# `proxy.ts` (antigo `middleware.ts`)

## O que é

No Next 16 o arquivo `middleware.ts` virou `proxy.ts`, com a função exportada `proxy`. Roda no runtime Node.js por padrão, antes do roteamento, e pode responder, redirecionar ou reescrever a requisição.

## Versão

Renomeado na 16.0.0 (a doc instalada, `proxy.md`, traz o histórico). Lab em 16.4.3.

## Onde no código

Cada zona tem o seu `proxy.ts` e um `matcher` estreito:

| Zona | Arquivo | O que faz |
|---|---|---|
| shell | `apps/shell/proxy.ts` | **Flag de rota:** `/catalog/sale` vira `/catalog/pt/sale-a` ou `/catalog/pt/sale-b` conforme o cookie `lab_flag_sale` (reescrita para o catálogo). Também devolve 404 para `/account/internal/*`, para que o endpoint interno de invalidação da conta não vaze pelo `rewrites` do shell |
| account | `apps/account/proxy.ts` | **Porta de login:** sem cookie `lab_user` válido, redireciona para `/login?next=<caminho>`. `POST` com header `next-action` passa direto (a própria Server Action decide, ver `update-tag.md#server-action-sem-sessão`). `login`, `api` e `internal` ficam de fora pelo `matcher` |
| catalog | `apps/catalog/proxy.ts` | **Checagem de 404:** produto ou guia inexistente é reescrito para `/catalog/<lang>/_missing`, que responde 404 de verdade. Motivo e detalhes em `isr-shell.md#desvio-do-plano-404-de-verdade-para-produto-inexistente` |

A relação com `rewrites` (que roda depois do proxy) está em `multi-zones.md`.

## Como observar

- Flag: `curl -s -H 'Cookie: lab_flag_sale=b' localhost:3000/catalog/sale` traz a variante B (e2e `proxy routes /catalog/sale by flag cookie`, em `e2e/zones.spec.ts`).
- Login: abrir `/account/orders` sem cookie redireciona para `/account/login?next=...` (`e2e/auth.spec.ts`).
- 404: `curl -I localhost:3000/catalog/pt/products/999` responde 404 (`e2e/catalog.spec.ts`); `/account/internal/revalidate` pelo shell também (`e2e/internal-endpoint.spec.ts`).
- O log do `next dev` mostra o tempo do proxy por requisição (`proxy.ts: 1.6ms`), como no trecho de `update-tag.md`.
