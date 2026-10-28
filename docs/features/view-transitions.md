# View Transitions e Fragment Refs (React 19.3)

## O que é

- `<ViewTransition>` liga a View Transitions API do navegador ao React. Elementos com o mesmo `name` em duas telas viram um "elemento compartilhado": o navegador anima de uma posição para a outra. Navegações do App Router já são transições, então não é preciso configurar nada no Next.
- `<Link transitionTypes={[...]}>` chama `addTransitionType` dentro da transição da navegação; os tipos chegam a `document.startViewTransition({ types })` e podem ser usados no CSS com `:active-view-transition-type(slide)` ou nas props de `<ViewTransition>` (`share={{ slide: '...' }}`).
- Fragment Refs: `<Fragment ref={ref}>` dá um `FragmentInstance` que age sobre os nós DOM filhos do fragmento sem precisar de um elemento de embrulho (`scrollIntoView`, `focus`, `focusLast`, `blur`, `addEventListener`, `observeUsing`, `getClientRects`...).

## Versão

React 19.3.1, que o Next 16.4.3 empacota em `next/dist/compiled/react`. `ViewTransition` e `addTransitionType` são exports estáveis (sem `unstable_`), inclusive no build `react-server`, então `<ViewTransition>` pode ficar num Server Component. Fragment Refs também estão no build estável: `FragmentInstance.prototype.scrollIntoView(alignToTop?)` e `focus(options?)` existem no `react-dom-client`, e o tipo `FragmentInstance` vem de `@types/react` 19.3 aumentado por `@types/react-dom`. `focus()` foca o primeiro descendente focável, por isso a seção de avaliações tem `tabIndex={-1}`.

## Onde no código

- `apps/catalog/app/catalog/[lang]/page.tsx`: `ProductLink` embrulha o nome em `<ViewTransition name={`product-${id}`}><span>…</span></ViewTransition>` (precisa de um elemento DOM dentro; texto solto não recebe `view-transition-name`) e usa `transitionTypes={['slide']}`.
- `apps/catalog/app/catalog/[lang]/products/[id]/page.tsx`: `<ViewTransition name={`product-${product.id}`}><h1>…</h1></ViewTransition>`.
- `apps/catalog/app/catalog/[lang]/products/[id]/ReviewsJump.tsx` (Client Component): botão "Ver avaliações" que chama `ref.current.scrollIntoView()` e `ref.current.focus()` num `<Fragment ref>` em volta do `<Suspense>` das avaliações. A página passa as avaliações pela prop `reviews` e o estoque + "Related" como `children`, para o botão ficar no topo e a seção no fim.

Não há CSS de animação no lab: o tipo `slide` chega à transição, mas o efeito visível é o cross-fade padrão do navegador mais o "morph" do título. Para dar um efeito ao tipo, bastaria uma regra `:active-view-transition-type(slide)` em CSS global ou `share={{ slide: 'slide-in' }}` no `<ViewTransition>`.

## Como observar

1. `pnpm prod`, abra `http://localhost:3000/catalog/pt` no Chrome e clique num produto: o nome sai da lista e "cresce" até o `<h1>`.
2. Para confirmar o nome e o tipo, antes do clique rode no console:
   `const o = document.startViewTransition.bind(document); document.startViewTransition = (a) => { console.log(a.types, [...document.querySelectorAll('*')].map(e => getComputedStyle(e).viewTransitionName).filter(n => n !== 'none')); return o(a); }`.
   Medido no build de produção ao clicar em "Produto 2": a primeira transição veio com `types: ["slide"]` e nomes `root`, `product-2`; as seguintes (revelação dos `<Suspense>`) vêm com `types: null`. No `next dev` a mesma medição mostrou `types: null` também na navegação, então confira o tipo no build de produção.
3. Na página de um produto, com a janela baixa, clique em "Ver avaliações": a página rola até "Avaliações" e a seção recebe o foco.
4. `e2e/instant.spec.ts` › "see reviews button scrolls to and focuses the reviews section".
