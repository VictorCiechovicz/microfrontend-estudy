# React Compiler: `reactCompiler` + `turbopackRustReactCompiler`

## O que é

`reactCompiler: true` liga o React Compiler, que memoiza componentes e hooks em tempo de build (o que antes era `useMemo`/`useCallback`/`memo` escrito à mão). `experimental.turbopackRustReactCompiler: true` troca a versão Babel (via Node.js) pela port nativa em Rust, que roda dentro do Turbopack. A segunda flag exige a primeira.

## Versão

Next 16.4.3. Os dois nomes existem em `node_modules/next/dist/server/config-shared.d.ts` (`reactCompiler?: boolean | ReactCompilerOptions` no topo; `experimental.turbopackRustReactCompiler?: boolean`, introduzida na 16.3.0). Com a flag Rust não é preciso instalar `babel-plugin-react-compiler`, e o projeto não instala.

## Onde no código

- `apps/catalog/next.config.ts`: `reactCompiler: true` e `experimental.turbopackRustReactCompiler: true`. Só o catálogo, para as outras zonas servirem de grupo de controle.

## Como observar

1. O log de `next build` / `next dev` do catálogo lista a flag experimental ligada (a `reactCompiler` é estável e não aparece nessa lista):
   ```
   catalog:build: - Experiments (use with caution):
   catalog:build:   ✓ exposeTestingApiInProductionBuild
   catalog:build:   · serverActions
   catalog:build:   ✓ turbopackRustReactCompiler
   ```
2. O efeito está no código gerado. O compilador injeta um cache de memoização por componente, com a sentinela `Symbol.for("react.memo_cache_sentinel")`. Depois de um build:
   ```
   cd apps/catalog && grep -l memo_cache_sentinel .next/static/chunks/*.js
   cd apps/account && grep -l memo_cache_sentinel .next/static/chunks/*.js
   ```
   Resultado capturado: 4 chunks no catálogo, 1 na conta. O chunk em comum (`27lh2y21yrn4l.js`, 207 KB) é o React/react-dom, que cita a string. Os outros 3 do catálogo são código do app compilado, por exemplo:
   ```
   (0,t.c)(24),{lang:h,labels:j}=e,[S,x]=(0,i.useState)(null);v[0]===Symbol.for("react.memo_cache_sentinel")?(c=async function(e){x(await a(e))},v[0]=c):c=v[0]
   function(){let e,r=(0,i.c)(1);return r[0]===Symbol.for("react.memo_cache_sentinel")?(e=(0,t.jsxs)("p",{children:["Rendered at ",Date.now()]})
   ```
   A conta, sem a flag, tem só o chunk do React: é o contraste que prova que foi o compilador.
3. Não há log "compilado pelo Rust". Para separar Babel de Rust, compare o tempo de `Compiled successfully` com `turbopackRustReactCompiler` ligado e desligado; não medi essa diferença (o app é pequeno demais para o número significar algo).

## Cuidado

O segundo trecho acima é o componente `HydrationMismatch` do laboratório de erros: o compilador hoisteia o `<p>Rendered at {Date.now()}</p>` para o cache de memoização. O e2e `error-lab.spec.ts` continua verde, então o mismatch demonstrado não depende de re-render.
