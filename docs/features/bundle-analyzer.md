# Bundle Analyzer: `next experimental-analyze`

## O que é

O Bundle Analyzer do Turbopack analisa o bundle de produção (sem gerar um build de aplicação). Modo padrão: sobe uma UI interativa na porta 4000. Opções úteis: `-o/--output` grava os arquivos de análise e sai (não sobe servidor), `--snapshot <nome>` guarda a captura com nome, e `next analyze export` imprime o grafo salvo como JSON Lines.

## Versão

Next 16.4.3, só Turbopack. `next experimental-analyze --help` lista os comandos acima; o alias `next analyze` também existe.

## Onde no código

- `package.json` (raiz): `"analyze": "pnpm --filter catalog exec next experimental-analyze"` (interativo: abre a UI em `http://localhost:4000`; encerre com Ctrl+C).
- Saída não interativa, usada para registrar estes números: `pnpm --filter account exec next experimental-analyze -o --snapshot confetti` e depois `... experimental-analyze export --snapshot confetti`. Os arquivos ficam em `apps/<app>/.next/diagnostics/analyze` (ignorado pelo git).

## Como observar

Execução real, conta:

```
✓ Analyze completed in 1784ms. Results written to apps/account/.next/diagnostics/analyze.
```

- O grafo exportado só trouxe chunks de cliente para as rotas `/orders/[id]` e `/(.)orders/[id]` da conta (12 e 11 chunks JS; ~652 KB brutos, ~245 KB comprimidos por rota). O maior chunk individual da conta é o de React/react-dom (207 KB).
- O efeito do `import('canvas-confetti')` lazy: o módulo `canvas-confetti/dist/confetti.module.mjs [app-client]` está na lista `async` de dependências de `PlaceOrderButton.tsx`, e não em `sync`. No build, o código dele fica no chunk próprio `41q87uv_0bu1l.js` (10 435 bytes), fora do bundle inicial da rota.

Catálogo (`pnpm analyze` equivalente, `-o --snapshot lab`, 2,9 s, 13 rotas): a rota de maior peso é `/catalog/[lang]/products/[id]`, com ~555 KB brutos e ~213 KB comprimidos de JS de cliente; as demais ficam entre 537 e 540 KB (o piso comum é React + runtime do Next + a ilha do host de Module Federation).

Na UI interativa (`pnpm analyze`), o mesmo dado aparece como árvore de treemap por rota; não abri a UI porque o agente roda sem navegador interativo, então os números acima vêm do `export`.
