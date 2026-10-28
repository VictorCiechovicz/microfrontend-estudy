# View Transitions e Fragment Refs (React 19.3)

## O que é

- `<ViewTransition>` liga a View Transitions API do navegador ao React. Elementos com o mesmo `name` em duas telas viram um "elemento compartilhado": o navegador anima de uma posição para a outra. Navegações do App Router já são transições, então não é preciso configurar nada no Next.
- `<Link transitionTypes={[...]}>` chama `addTransitionType` dentro da transição da navegação; os tipos chegam a `document.startViewTransition({ types })` e podem ser usados no CSS com `:active-view-transition-type(slide)` ou nas props de `<ViewTransition>` indexadas por tipo (`enter={{ slide: 'slide', default: 'none' }}`).
- Fragment Refs: `<Fragment ref={ref}>` dá um `FragmentInstance` que age sobre os nós DOM filhos do fragmento sem precisar de um elemento de embrulho (`scrollIntoView`, `focus`, `focusLast`, `blur`, `addEventListener`, `observeUsing`, `getClientRects`...).

## Versão

React 19.3.1, que o Next 16.4.3 empacota em `next/dist/compiled/react`. `ViewTransition` e `addTransitionType` são exports estáveis (sem `unstable_`), inclusive no build `react-server`, então `<ViewTransition>` pode ficar num Server Component. Fragment Refs também estão no build estável: `FragmentInstance.prototype.scrollIntoView(alignToTop?)` e `focus(options?)` existem no `react-dom-client`, e o tipo `FragmentInstance` vem de `@types/react` 19.3 aumentado por `@types/react-dom`. `focus()` foca o primeiro descendente focável, por isso a seção de avaliações tem `tabIndex={-1}`.

## Onde no código

- `apps/catalog/app/catalog/[lang]/page.tsx`: `ProductLink` embrulha o nome em `<ViewTransition name={`product-${id}`}><span>…</span></ViewTransition>` (precisa de um elemento DOM dentro; texto solto não recebe `view-transition-name`) e usa `transitionTypes={['slide']}`.
- `apps/catalog/app/catalog/[lang]/products/[id]/page.tsx`: `<ViewTransition name={`product-${product.id}`}><h1>…</h1></ViewTransition>`.
- `apps/catalog/app/catalog/[lang]/SlideTransition.tsx`: `<ViewTransition enter={{ slide: 'slide', default: 'none' }} exit={{ slide: 'slide', default: 'none' }} default="none">`. Envolve o conteúdo da lista (`[lang]/page.tsx`) e o da página de produto (`products/[id]/page.tsx`), no `page.tsx` e não no layout, porque o layout persiste entre navegações e `enter`/`exit` nunca disparariam nele (como a doc instalada recomenda). Só uma navegação com o tipo `slide` aplica a classe `slide`; sem tipo (voltar do navegador, links de "Related", revelação de `<Suspense>`) fica `none`.
- `apps/catalog/app/catalog/[lang]/view-transitions.css` (importado no layout `[lang]`): `::view-transition-old(.slide)` anima `slide-out` (200 ms, some para a esquerda) e `::view-transition-new(.slide)` anima `slide-in` (300 ms, entra pela direita), dentro de `@media (prefers-reduced-motion: no-preference)`.
- `apps/catalog/app/catalog/[lang]/products/[id]/ReviewsJump.tsx` (Client Component): botão "Ver avaliações" que chama `ref.current.scrollIntoView()` e `ref.current.focus({ preventScroll: true })` num `<Fragment ref>` em volta do `<Suspense>` das avaliações. A página passa as avaliações pela prop `reviews` e o estoque + "Related" como `children`, para o botão ficar no topo e a seção no fim.

### Tentativa descartada: CSS em `::view-transition-*(root)`

A primeira tentativa foi `html:active-view-transition-type(slide)::view-transition-old(root)` / `new(root)`. No teste, só o `slide-out` aparecia: o `::view-transition-new(root)` não tinha animação nenhuma (nem o `-ua-view-transition-fade-in` padrão), porque o React só anima a raiz quando ela mesma mudou. As props `enter`/`exit` por tipo, como na doc instalada, animam os dois lados.

### `focus()` e rolagem

Sem o `scrollIntoView()`, o `focus({ preventScroll: true })` do `FragmentInstance` ainda rolou a página no Chromium até a seção aparecer na borda de baixo (topo da seção em ≈ 230 px numa janela de 240 px). O teste por isso confere que o topo da seção ficou em 0, que é o alinhamento do `scrollIntoView()`.

## Como observar

1. `pnpm prod`, abra `http://localhost:3000/catalog/pt` no Chrome e clique num produto: a lista desliza para a esquerda e some, a página do produto entra pela direita, e o nome sai da lista e "cresce" até o `<h1>`. Clique num link de "Related": sem o tipo `slide`, a troca é só o cross-fade padrão. Para ver em câmera lenta: DevTools → menu ⋮ → More tools → Animations, velocidade 10%.
2. Para confirmar o nome e o tipo, antes do clique rode no console:
   `const o = document.startViewTransition.bind(document); document.startViewTransition = (a) => { console.log(a.types, [...document.querySelectorAll('*')].map(e => getComputedStyle(e).viewTransitionName).filter(n => n !== 'none')); return o(a); }`.
   Medido no build de produção ao clicar em "Produto 2": a primeira transição veio com `types: ["slide"]` e nomes `root`, `product-2`; as seguintes (revelação dos `<Suspense>`) vêm com `types: null`. No `next dev` a mesma medição mostrou `types: null` também na navegação, então confira o tipo no build de produção.
3. Na página de um produto, com a janela baixa, clique em "Ver avaliações": a página rola até "Avaliações" e a seção recebe o foco.
4. `e2e/instant.spec.ts` › "slide transition type animates the page change": intercepta `document.startViewTransition` e, no `ready`, lista os `CSSAnimation` ativos; espera `slide-out` e `slide-in`. Sem `transitionTypes={['slide']}` no `ProductLink` aparecem só os `-ua-view-transition-fade-*` padrão e o teste falha.
5. `e2e/instant.spec.ts` › "see reviews button scrolls to and focuses the reviews section".
