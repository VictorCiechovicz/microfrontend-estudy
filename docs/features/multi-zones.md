# Multi-Zones

Três apps Next.js 16.4.3 independentes aparecem para o usuário como uma loja só, em `http://localhost:3000`.

| Zona | Porta | Caminhos públicos | Como evita conflito de assets |
|---|---|---|---|
| `shell` | 3000 | `/` e tudo que não for de outra zona | nenhum (é a zona padrão) |
| `catalog` | 3001 | `/catalog/[lang]/...` | `assetPrefix: '/catalog-static'` |
| `account` | 3002 | `/account/...` | `basePath: '/account'` |

O shell é a porta de entrada: recebe todas as requisições e repassa as das outras zonas.

## `assetPrefix` (catalog) vs `basePath` (account)

- **`assetPrefix`** muda só o endereço dos assets (`/catalog-static/_next/static/...`). As rotas continuam sendo o que está em `app/`, por isso as páginas do catálogo moram em `app/catalog/[lang]/` e o layout raiz fica em `app/catalog/[lang]/layout.tsx` (não existe `app/layout.tsx` no catálogo). O `<Link>` usa o caminho completo (`/catalog/pt/guides`).
- **`basePath`** prefixa tudo: rotas, assets (`/account/_next/...`), `<Link>`, `redirect()` e `router.push()`. As páginas ficam em `app/` normal e o código escreve `href="/orders"`, que vira `/account/orders`.

Na prática: `assetPrefix` dá controle total das URLs e exige escrever o prefixo nas rotas; `basePath` esconde o prefixo do código, mas amarra a zona inteira a ele.

### Desvio em relação ao plano (16.4.3)

O plano previa que o catálogo precisaria de um rewrite próprio `/catalog-static/_next/:path+ → /_next/:path+`. No 16.4.3 isso não é necessário: o guia de Multi-Zones empacotado (`node_modules/next/dist/docs/01-app/02-guides/multi-zones.md`) diz que o rewrite extra só era preciso antes do Next 15, e o servidor do catálogo já responde `200` em `http://localhost:3001/catalog-static/_next/static/...`. Por isso o `next.config.ts` do catálogo só declara o `assetPrefix`.

## `rewrites` vs `proxy.ts` (no shell)

- **`rewrites()`** em `apps/shell/next.config.ts` cobre o roteamento fixo: `/catalog`, `/catalog/:path+` e `/catalog-static/:path+` vão para `CATALOG_URL`; `/account` e `/account/:path+` vão para `ACCOUNT_URL`, mantendo o caminho. É a opção recomendada, com menos latência. As regras são calculadas no `next build` e gravadas em `.next/routes-manifest.json`, então mudar `CATALOG_URL` ou `ACCOUNT_URL` exige rebuild do shell.
- **`proxy.ts`** (o antigo `middleware.ts`, renomeado no Next 16) serve para decisões por requisição. Aqui ele lê o cookie de feature flag `lab_flag_sale`: `/catalog/sale` vira `/catalog/pt/sale-b` quando o cookie vale `b`, e `/catalog/pt/sale-a` nos demais casos, via `NextResponse.rewrite` para a URL do catálogo. O `matcher: ['/catalog/sale']` limita o proxy a esse caminho. O proxy roda antes dos `rewrites`, então ganha da regra `/catalog/:path+`, e lê `CATALOG_URL` em tempo de execução.

`CATALOG_URL` e `ACCOUNT_URL` têm default no código (`apps/shell/lib/zone-urls.ts`: `http://localhost:3001` e `http://localhost:3002`), então nada depende de `.env`.

Para testar a flag, crie o cookie no DevTools (`document.cookie = 'lab_flag_sale=b'`) e recarregue `/catalog/sale`: o título muda de "Sale A" para "Sale B", e a URL na barra continua `/catalog/sale`.

## Navegação dura vs suave

- **Entre zonas** (shell → catalog, catalog → account) o link é um `<a>` comum e a navegação é **dura**: o navegador descarrega a página e baixa o HTML e o JS da outra zona. Um `<Link>` aqui tentaria prefetch e navegação suave para uma rota que a zona atual não conhece.
- **Dentro da mesma zona** o link é `<Link>` e a navegação é **suave**: só o payload RSC da rota nova é buscado e o `window` continua o mesmo.

Onde observar:

1. No console do navegador, em `/`, rode `window.__marker = 1` e clique em "Catalog". Depois rode `window.__marker`: dá `undefined`, porque a página foi recarregada.
2. Em `/catalog/pt`, repita e clique em "Guides": `window.__marker` continua `1`.
3. Na aba Network, a navegação dura mostra um request de documento (`/catalog/pt`) e os scripts em `/catalog-static/_next/...`; a suave mostra só um fetch com `?_rsc=` (header `RSC: 1`).
4. O atributo `<html data-zone="...">` indica qual zona renderizou a página.

O spec `e2e/zones.spec.ts` automatiza esses passos.

## Configuração comum às zonas

As três ligam `cacheComponents: true` e `partialPrefetching: true` (ambas chaves de topo no 16.4.3; `partialPrefetching` exige `cacheComponents`) e `experimental.serverActions.allowedOrigins: ['localhost:3000']`, porque o navegador sempre fala com o shell e o `Origin` das Server Actions é `localhost:3000`, não a porta da zona.
