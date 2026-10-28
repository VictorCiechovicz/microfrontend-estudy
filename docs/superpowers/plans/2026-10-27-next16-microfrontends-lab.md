# next16-microfrontends-lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir uma loja fictícia local, dividida em três zonas Next.js 16.4 (Multi-Zones) e um remote React 19 de Module Federation, onde cada novidade do Next 16.x aparece de forma observável.

**Architecture:** Monorepo pnpm + Turborepo. `shell` (:3000) é a porta de entrada e encaminha `/catalog/*` para `catalog` (:3001, via `assetPrefix`) e `/account/*` para `account` (:3002, via `basePath`). O remote `widgets` (:3003, Rsbuild + Module Federation 2.0) é carregado só no navegador pelas zonas. Os dados ficam num SQLite local (`node:sqlite`) compartilhado. A coerência de cache entre zonas usa um endpoint interno de invalidação em cada app Next.

**Tech Stack:** Next.js 16.4.3, React 19.3.1, TypeScript 7.0.2, pnpm 12, Turborepo 2.11.10, Rsbuild 2.2.14, @module-federation/enhanced + rsbuild-plugin 2.9.2, node:sqlite (Node 26), Playwright 1.64.1 + @next/playwright 16.4.3, Vitest 5.0.5, Biome 2.6.3.

**Spec:** `docs/superpowers/specs/2026-10-27-next16-microfrontends-lab-design.md`

## Global Constraints

- Raiz do projeto: `~/Projects/next16-microfrontends-lab`. Node ≥ 24 (`engines`); máquina local tem v26.12.1.
- Versões fixadas **sem `^`/`~`**: `next@16.4.3`, `react@19.3.1`, `react-dom@19.3.1`, `typescript@7.0.2`, `turbo@2.11.10`, `@rsbuild/core@2.2.14`, `@rsbuild/plugin-react@2.1.1`, `@module-federation/enhanced@2.9.2`, `@module-federation/rsbuild-plugin@2.9.2`, `@playwright/test@1.64.1`, `@next/playwright@16.4.3`, `vitest@5.0.5`, `@biomejs/biome@2.6.3`, `babel-plugin-react-compiler@1.0.0`, `concurrently@10.0.6`.
- Portas fixas: shell 3000, catalog 3001, account 3002, widgets 3003. O usuário sempre usa `http://localhost:3000`.
- As três zonas Next ligam `cacheComponents: true` e `partialPrefetching: true`.
- Todas as Server Actions das zonas: `experimental.serverActions.allowedOrigins: ['localhost:3000']`.
- Código, identificadores e testes em inglês. README e `docs/features/*.md` em português.
- Nenhum serviço externo; nenhum deploy; nenhum CI.
- Links entre zonas usam `<a>`; dentro da mesma zona, `<Link>`.
- Module Federation: nem webpack numa zona nem iframe são fallback aceitos.
- Se uma API do Next divergir do que este plano descreve (nome, flag, status), adaptar ao release instalado e registrar em `docs/features/<feature>.md`. Só remover a funcionalidade se a API não existir, e avisar o Victor.
- Commits locais por tarefa (sem push, sem remote configurado).

## Review Focus

1. **Remote de widgets fora do ar** (`:3003` parado): a página da zona deve renderizar normalmente, com o fallback do widget, sem erro na tela. → teste na Task 3.
2. **Uma zona fora do ar durante o broadcast de invalidação**: a ação do usuário conclui normalmente e o resultado do broadcast registra a falha sem lançar. → teste na Task 5.
3. **Produto inexistente** (`/catalog/pt/products/9999`): 404 da zona, e o `catchError` do bloco de estoque não engole o `notFound()`. → teste na Task 8.
4. **Idioma não suportado** (`/catalog/xx`): 404, não página em branco nem erro 500. → teste na Task 8.
5. **Usuário deslogado chamando a API do carrinho ou uma Server Action**: 401 ou redirect para login, nunca 500. → teste nas Tasks 7 e 11.

---

## File Structure

```
package.json  pnpm-workspace.yaml  turbo.json  biome.json  .gitignore  .env.example
playwright.config.ts
e2e/                         specs Playwright (um arquivo por tarefa que os cria)
packages/
  tsconfig/                  base.json, nextjs.json, library.json
  db/                        src/{client,schema,seed,latency,faults,repos/*}.ts, src/index.ts
  cache-sync/                src/{tags,zones,broadcast,revalidate-handler}.ts, src/index.ts
  ui/                        src/{SiteHeader,SiteFooter,Button,Card,Price,Badge}.tsx + *.module.css, src/index.ts
  mf-host/                   src/{runtime,RemoteWidget}.tsx, src/index.ts   (client-only)
apps/
  shell/                     next.config.ts, proxy.ts, app/{layout,page}.tsx, app/internal/revalidate/route.ts, app/icon.{png,svg}
  catalog/                   next.config.ts, app/catalog/[lang]/..., app/internal/revalidate/route.ts, app/catalog/api/...
  account/                   next.config.ts (basePath '/account'), proxy.ts, app/..., app/internal/revalidate/route.ts, app/api/cart/route.ts
  widgets/                   rsbuild.config.ts, src/{CartWidget,Recommendations,mount}.tsx, src/standalone.tsx
docs/features/               uma nota por funcionalidade
README.md
```

---

### Task 1: Monorepo scaffold

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `biome.json`, `.gitignore`, `.env.example`, `packages/tsconfig/{package.json,base.json,nextjs.json,library.json}`

**Interfaces:**
- Produces: root scripts `dev`, `build`, `prod`, `test`, `e2e`, `typecheck`, `lint`, `db:reset`, `analyze`; workspace globs `apps/*`, `packages/*`; package `@lab/tsconfig`.

- [ ] **Step 1: `git init` e arquivos de raiz.** `pnpm-workspace.yaml` com `apps/*` e `packages/*`. `.gitignore` inclui `node_modules`, `.next`, `dist`, `.turbo`, `.data`, `test-results`, `playwright-report`. `.env.example` com `LAB_INTERNAL_SECRET=lab-dev-secret`, `LAB_LATENCY_MS=400`, `LAB_DB_PATH=.data/lab.sqlite`, `NEXT_PUBLIC_WIDGETS_URL=http://localhost:3003`.
- [ ] **Step 2: Scripts de raiz.** `dev` = `turbo run dev --parallel`; `build` = `turbo run build`; `prod` = `turbo run build && turbo run start --parallel`; `test` = `turbo run test`; `e2e` = `playwright test`; `typecheck` = `turbo run typecheck`; `db:reset` = `pnpm --filter @lab/db reset`; `analyze` = `pnpm --filter catalog exec next experimental-analyze`. `turbo.json` define `dev`/`start` como `persistent: true, cache: false`.
- [ ] **Step 3: tsconfig compartilhado.** `base.json` (strict, `moduleResolution: bundler`, `target: ES2023`), `nextjs.json` estende base com `jsx: preserve` e plugin `next`; `library.json` para pacotes.
- [ ] **Step 4: Verificar.** Run: `pnpm install && pnpm biome check .` → Expected: install sem erro, Biome sem erros.
- [ ] **Step 5: Commit** `chore: scaffold monorepo`.

---

### Task 2: Três zonas Next + roteamento Multi-Zones

**Files:**
- Create: `apps/shell/**`, `apps/catalog/**`, `apps/account/**` (package.json, next.config.ts, tsconfig.json, app mínimo), `playwright.config.ts`, `e2e/zones.spec.ts`, `docs/features/multi-zones.md`

**Interfaces:**
- Produces: URLs públicas `/` (shell), `/catalog/[lang]` (catalog), `/account` (account); env `CATALOG_URL=http://localhost:3001`, `ACCOUNT_URL=http://localhost:3002`; cookie de feature flag `lab_flag_sale`; rota `/catalog/sale` (variante `/catalog/pt/sale-b` quando o cookie vale `b`).

- [ ] **Step 1: Escrever `e2e/zones.spec.ts`** (falha):

```ts
test('shell serves home', ...)                // GET / → h1 "Lab Store"
test('catalog zone is served under /catalog', ...) // /catalog/pt → h1 "Catalog"; html[data-zone="catalog"]
test('account zone is served under /account', ...) // /account → html[data-zone="account"]
test('cross-zone link is a hard navigation', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { (window as any).__marker = 1 });
  await page.getByRole('link', { name: 'Catalog' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-zone', 'catalog');
  expect(await page.evaluate(() => (window as any).__marker)).toBeUndefined();
});
test('same-zone link is a soft navigation', ...)    // em /catalog/pt clicar "Guides": __marker continua 1
test('proxy routes /catalog/sale by flag cookie', ...) // sem cookie → h1 "Sale A"; cookie lab_flag_sale=b → "Sale B"
```

- [ ] **Step 2: `playwright.config.ts`.** `baseURL: http://localhost:3000`; `workers: 1`, `fullyParallel: false`; `webServer` com quatro entradas (`pnpm --filter <app> start`, portas 3000–3003, `reuseExistingServer: false`, para o cache em memória começar limpo). Mudar o script de raiz `e2e` para `pnpm db:reset && pnpm build && playwright test`: o build vem depois do reset porque as páginas pré-renderizadas carregam dados do banco.
  - **Dono dos dados no e2e** (para os specs não interferirem entre si): Ana (1) → `auth`, `account`; Bruno (2) → `coherence`; Carla (3) → `widgets`. Produtos: 1–3 pré-renderizados/OG, 2 `instant`, 4 falha de estoque, 5 `widgets`, 6 e 7 `coherence`, 8 pedido offline em `account`, 10 ISR, 9999 inexistente.
- [ ] **Step 3: Run `pnpm build && pnpm e2e e2e/zones.spec.ts`** → Expected: FAIL.
- [ ] **Step 4: Configurar as zonas.**
  - `catalog/next.config.ts`: `assetPrefix: '/catalog-static'`; rotas em `app/catalog/[lang]/` (layout raiz em `app/catalog/[lang]/layout.tsx`, `generateStaticParams` → `[{lang:'pt'},{lang:'en'}]`); `<html data-zone="catalog">`. Páginas placeholder: `/catalog/[lang]` (h1 "Catalog"), `/catalog/[lang]/guides`, `/catalog/[lang]/sale-a` (h1 "Sale A"), `/catalog/[lang]/sale-b` (h1 "Sale B").
  - `account/next.config.ts`: `basePath: '/account'`; `<html data-zone="account">`.
  - `shell/next.config.ts`: `rewrites()` para `/catalog`, `/catalog/:path+`, `/catalog-static/:path+` → `CATALOG_URL`; `/account`, `/account/:path+` → `ACCOUNT_URL` (mantendo o path). Home com link `<a href="/catalog/pt">Catalog</a>`.
  - `shell/proxy.ts`: `/catalog/sale` → `NextResponse.rewrite` para `${CATALOG_URL}/catalog/pt/sale-b` se o cookie `lab_flag_sale === 'b'`, senão `.../sale-a`. `matcher: ['/catalog/sale']`.
  - Scripts de cada app: `dev`/`start` com `-p <porta>`, `typecheck` = `tsc --noEmit`.
- [ ] **Step 5: Run `pnpm build && pnpm e2e e2e/zones.spec.ts`** → Expected: PASS (6 testes).
- [ ] **Step 6: `docs/features/multi-zones.md`**: `assetPrefix` (catalog) vs `basePath` (account), `rewrites` vs `proxy.ts`, navegação dura vs suave e onde observar cada uma.
- [ ] **Step 7: Commit** `feat: multi-zones routing between shell, catalog and account`.

---

### Task 3: Spike de Module Federation (gate)

**Files:**
- Create: `apps/widgets/{package.json,rsbuild.config.ts,src/HelloWidget.tsx,src/mount.tsx,src/standalone.tsx,index.html}`, `packages/mf-host/{package.json,src/runtime.ts,src/RemoteWidget.tsx,src/index.ts}`, `e2e/mf-spike.spec.ts`, `docs/features/module-federation.md`
- Modify: `apps/catalog/app/catalog/[lang]/page.tsx` (renderiza `<RemoteWidget name="HelloWidget" />`)

**Interfaces:**
- Produces:
  - Remote `widgets`, manifest em `http://localhost:3003/mf-manifest.json`, remote name `widgets`.
  - Contrato de cada módulo exposto (`./HelloWidget`, depois `./CartWidget`, `./Recommendations`):
    ```ts
    export default function Widget(props: P): JSX.Element            // caminho "shared"
    export function mount(el: HTMLElement, props: P): { update(p: P): void; unmount(): void } // caminho "mount"
    ```
  - `@lab/mf-host`: `getFederation(): ModuleFederation` (singleton via `createInstance` de `@module-federation/enhanced/runtime`); `<RemoteWidget<P> name: 'HelloWidget' | 'CartWidget' | 'Recommendations'; props?: P; fallback?: ReactNode />`; constante `MF_STRATEGY: 'shared' | 'mount'` definida pelo spike.

- [ ] **Step 1: Escrever `e2e/mf-spike.spec.ts`** (falha):

```ts
test('remote widget renders inside catalog zone', async ({ page }) => {
  const errors: string[] = []; page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.goto('/catalog/pt');
  await expect(page.getByTestId('hello-widget')).toHaveText('Hello from widgets');
  expect(errors.filter(e => /Invalid hook call|more than one copy of React/.test(e))).toEqual([]);
});
test('page still renders when widgets remote is down', async ({ page }) => {
  await page.route('http://localhost:3003/**', r => r.abort());
  await page.goto('/catalog/pt');
  await expect(page.getByRole('heading', { name: 'Catalog' })).toBeVisible();
  await expect(page.getByTestId('widget-fallback')).toBeVisible();
});
```

- [ ] **Step 2: Run** → Expected: FAIL.
- [ ] **Step 3: Remote.** `rsbuild.config.ts` com `pluginReact()` e `pluginModuleFederation({ name: 'widgets', exposes: { './HelloWidget': './src/HelloWidget.tsx' }, shared: { react: { singleton: true, requiredVersion: false }, 'react-dom': { singleton: true, requiredVersion: false } } })`; `server.port: 3003`; `server.headers` com `Access-Control-Allow-Origin: *`; `output.assetPrefix: 'http://localhost:3003/'`. Scripts: `dev` = `rsbuild dev`, `build` = `rsbuild build`, `start` = `rsbuild preview`. `HelloWidget` renderiza `<p data-testid="hello-widget">Hello from widgets</p>` e exporta `mount` (via `createRoot`).
- [ ] **Step 4: Host, tentativa "shared".** `getFederation()` registra `react` e `react-dom` no shared com `lib: () => React` / `() => ReactDOM` importados dentro do Client Component (o React empacotado pelo Next), `version: React.version`, `shareConfig: { singleton: true, requiredVersion: false }`. `RemoteWidget` é `'use client'`, carrega em `useEffect` com `loadRemote('widgets/<name>')`, renderiza o `default`; se o carregamento falhar, mostra `fallback` ou `<span data-testid="widget-fallback">Widget unavailable</span>`.
- [ ] **Step 5: Run `pnpm build && pnpm e2e e2e/mf-spike.spec.ts`.**
  - PASS → `MF_STRATEGY = 'shared'`.
  - Falha por React duplicado/hooks → trocar para `MF_STRATEGY = 'mount'`: o `RemoteWidget` chama `mount(ref.current, props)` e `unmount()` na limpeza; o remote passa a não depender do shared de React. Rodar de novo → Expected: PASS.
  - Se nenhum dos dois passar: **parar e reportar ao Victor** com o erro, sem seguir para a Task 4.
- [ ] **Step 6: `docs/features/module-federation.md`**: por que o MF fica fora do Next (App Router + Turbopack sem suporte; `nextjs-mf` só Pages Router e em manutenção), qual estratégia funcionou, o erro observado na outra e a diferença para Multi-Zones.
- [ ] **Step 7: Commit** `feat: module federation spike with runtime-loaded widget`.

---

### Task 4: `@lab/db` (SQLite)

**Files:**
- Create: `packages/db/{package.json,vitest.config.ts,src/client.ts,src/schema.ts,src/seed.ts,src/latency.ts,src/faults.ts,src/repos/{products,users,cart,orders,notifications}.ts,src/index.ts,src/*.test.ts}`

**Interfaces:**
- Produces (todas síncronas sobre `DatabaseSync`, exceto `withLatency`):
  ```ts
  type Lang = 'pt' | 'en'; const LANGS: readonly Lang[]
  type Product = { id: number; slug: string; name: string; description: string; priceCents: number }
  type CartLine = { productId: number; name: string; priceCents: number; qty: number }
  type Order = { id: number; userId: number; totalCents: number; createdAt: string; lines: CartLine[] }
  type Notification = { id: number; userId: number; text: string; read: boolean; createdAt: string }
  type User = { id: number; name: string }
  getDb(): DatabaseSync                    // LAB_DB_PATH, WAL, cria schema se faltar
  resetDb(): void                          // drop + schema + seed
  withLatency<T>(fn: () => T, ms?: number): Promise<T>   // default LAB_LATENCY_MS
  listProducts(lang: Lang): Product[]; getProduct(id: number, lang: Lang): Product | null
  getStock(productId: number): number      // lança Error('Stock service unavailable') se houver falha injetada
  listReviews(productId: number): { author: string; text: string; rating: number }[]
  setPrice(productId: number, priceCents: number): void
  getRecommendations(excludeProductId?: number, limit?: number): Product[]   // lang 'en'
  listUsers(): User[]; getUser(id: number): User | null; updateProfile(userId: number, name: string): void
  getCart(userId: number): CartLine[]; addToCart(userId: number, productId: number, qty?: number): void
  removeFromCart(userId: number, productId: number): void
  placeOrder(userId: number): Order        // lança Error('Cart is empty'); decrementa estoque, esvazia carrinho, cria notificação
  listOrders(userId: number): Order[]
  listNotifications(userId: number): Notification[]; unreadCount(userId: number): number
  markNotificationRead(userId: number, id: number): void
  injectFault(key: 'stock', count: number): void   // próximas `count` chamadas de getStock lançam
  ```
- Seed: 12 produtos (ids 1–12), nome pt `Produto ${id}`, nome en `Product ${id}`, preço `1000 + id * 100` centavos, estoque 5 cada, 2–4 reviews por produto, usuários `{1,'Ana'}`, `{2,'Bruno'}`, `{3,'Carla'}`, uma notificação não lida para cada.

- [ ] **Step 1: Testes Vitest** (falham), com `LAB_DB_PATH` apontando para um arquivo temporário por teste:

```ts
test('seed creates 12 products translated', () => { expect(listProducts('pt')).toHaveLength(12); expect(getProduct(1,'en')!.name).not.toBe(getProduct(1,'pt')!.name) })
test('placeOrder decrements stock, clears cart and notifies', () => { addToCart(1,3,2); const o = placeOrder(1); expect(getStock(3)).toBe(3); expect(getCart(1)).toEqual([]); expect(o.totalCents).toBe(2*getProduct(3,'en')!.priceCents); expect(unreadCount(1)).toBe(2) })
test('placeOrder on empty cart throws', () => { expect(() => placeOrder(2)).toThrow('Cart is empty') })
test('injected stock fault fails once then recovers', () => { injectFault('stock',1); expect(() => getStock(1)).toThrow('Stock service unavailable'); expect(getStock(1)).toBe(5) })
test('getProduct unknown id returns null', () => { expect(getProduct(9999,'pt')).toBeNull() })
```

- [ ] **Step 2: Run `pnpm --filter @lab/db test`** → Expected: FAIL.
- [ ] **Step 3: Implementar** com `node:sqlite` (`DatabaseSync`), `PRAGMA journal_mode = WAL`; faults numa tabela `faults(key TEXT PRIMARY KEY, remaining INTEGER)` (estado compartilhado entre os processos das zonas). Script `reset` = `node --experimental-strip-types src/reset-cli.ts` (ou equivalente) chamando `resetDb()`.
- [ ] **Step 4: Run** → Expected: PASS (5 testes).
- [ ] **Step 5: Commit** `feat: sqlite data package with seed and fault injection`.

---

### Task 5: `@lab/cache-sync` + endpoints internos

**Files:**
- Create: `packages/cache-sync/{package.json,src/tags.ts,src/zones.ts,src/broadcast.ts,src/revalidate-handler.ts,src/index.ts,src/*.test.ts}`, `apps/shell/app/internal/revalidate/route.ts`, `apps/catalog/app/internal/revalidate/route.ts`, `apps/account/app/internal/revalidate/route.ts`, `e2e/internal-endpoint.spec.ts`, `docs/features/cross-zone-cache.md`
- Modify: `apps/shell/proxy.ts` (bloqueio de `/internal/*` e `/account/internal/*`)

**Interfaces:**
- Produces:
  ```ts
  const tags = {
    products: () => 'products',
    product: (id: number) => `product:${id}`,
    stock: (id: number) => `stock:${id}`,
    userProfile: (userId: number) => `user:${userId}:profile`,
    userOrders: (userId: number) => `user:${userId}:orders`,
    userCart: (userId: number) => `user:${userId}:cart`,
    userNotifications: (userId: number) => `user:${userId}:notifications`,
  }
  type ZoneName = 'shell' | 'catalog' | 'account'
  const ZONE_REVALIDATE_URLS: Record<ZoneName, string> // http://localhost:3000/internal/revalidate, :3001/internal/revalidate, :3002/account/internal/revalidate
  broadcastInvalidation(tags: string[], opts: { from: ZoneName }): Promise<{ zone: ZoneName; ok: boolean; error?: string }[]>
  createRevalidateHandler(revalidate: (tag: string) => void): (req: Request) => Promise<Response>
  ```
  - O handler aceita só `POST` com header `x-lab-secret === process.env.LAB_INTERNAL_SECRET ?? 'lab-dev-secret'` e body `{ tags: string[] }`. Responde 401 com segredo errado, 400 com body inválido e 200 `{ revalidated: string[] }`.
  - Cada `route.ts` exporta `POST = createRevalidateHandler(tag => revalidateTag(tag, { expire: 0 }))`.
  - `broadcastInvalidation` envia para todas as zonas menos `from`, com `Promise.allSettled` e `AbortSignal.timeout(2000)`. Nunca lança; registra `console.warn` para cada falha.

- [ ] **Step 1: Testes Vitest** (falham):

```ts
test('broadcast skips the origin zone', ...)        // from 'account' → fetch chamado para shell e catalog apenas
test('broadcast never throws when a zone is down', async () => { fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED')); const r = await broadcastInvalidation(['stock:1'], { from: 'account' }); expect(r.find(x => !x.ok)?.error).toMatch('ECONNREFUSED') })
test('handler rejects wrong secret with 401', ...)
test('handler rejects body without tags array with 400', ...)
test('handler revalidates every tag', ...)          // revalidate chamado com 'stock:1' e 'product:1'
```

- [ ] **Step 2: Escrever `e2e/internal-endpoint.spec.ts`**: `POST http://localhost:3000/account/internal/revalidate` com o segredo certo → 404 (bloqueado pelo proxy do shell); `POST http://localhost:3002/account/internal/revalidate` sem segredo → 401; com segredo → 200.
- [ ] **Step 3: Run unit + e2e** → Expected: FAIL.
- [ ] **Step 4: Implementar o pacote, os três `route.ts` e o bloqueio no `proxy.ts` do shell** (`matcher` passa a incluir `/internal/:path*` e `/account/internal/:path*` → `new NextResponse(null, { status: 404 })`).
- [ ] **Step 5: Run** → Expected: PASS.
- [ ] **Step 6: `docs/features/cross-zone-cache.md`**: o problema (cache por processo), o vocabulário de tags, `updateTag` local + `revalidateTag(tag, { expire: 0 })` remoto, e o que acontece com uma zona fora do ar (aviso perdido; vale o `cacheLife`).
- [ ] **Step 7: Commit** `feat: cross-zone cache invalidation endpoints`.

---

### Task 6: `@lab/ui` (design system)

**Files:**
- Create: `packages/ui/{package.json,src/SiteHeader.tsx,src/SiteFooter.tsx,src/Button.tsx,src/Card.tsx,src/Price.tsx,src/Badge.tsx,src/*.module.css,src/index.ts}`, `e2e/ui.spec.ts`
- Modify: layouts raiz das três zonas; `next.config.ts` das três (`transpilePackages: ['@lab/ui', '@lab/db', '@lab/cache-sync', '@lab/mf-host']`)

**Interfaces:**
- Produces:
  ```ts
  SiteHeader(props: { zone: 'shell' | 'catalog' | 'account'; userSlot?: ReactNode; cartSlot?: ReactNode }): JSX.Element
  // links: "Home" → <a href="/">, "Catalog" → <a href="/catalog/pt">, "Account" → <a href="/account">
  SiteFooter(): JSX.Element
  Button(props: ButtonHTMLAttributes & { variant?: 'primary' | 'ghost' })
  Card(props: { title: string; href?: string; children?: ReactNode })
  Price(props: { cents: number; lang?: 'pt' | 'en' })   // pt → "R$ 12,90", en → "$12.90"
  Badge(props: { count: number; label: string })        // aria-label `${count} ${label}`
  ```
  Os links do `SiteHeader` são sempre `<a>`, porque atravessam zonas.

- [ ] **Step 1: `e2e/ui.spec.ts`** (falha): o banner `SiteHeader` e o `contentinfo` existem em `/`, `/catalog/pt` e `/account/login`; `Price` em `/catalog/pt` mostra o formato `R$`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implementar** com CSS Modules (a demonstração das classes curtas em produção, da 16.4, depende disso). **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: shared ui package across zones`.

---

### Task 7: Login falso + `proxy.ts` da conta

**Files:**
- Create: `apps/account/proxy.ts`, `apps/account/app/login/{page.tsx,actions.ts}`, `apps/account/lib/session.ts`, `e2e/auth.spec.ts`

**Interfaces:**
- Produces: cookie `lab_user` (id numérico, `path=/`, `httpOnly`, `sameSite=lax`); `getSessionUserId(): Promise<number | null>` (lê `cookies()`); `requireUserId(): Promise<number>` (redireciona para `/account/login`); Server Actions `login(formData)` (campo `userId`) e `logout()`.
- `apps/account/proxy.ts`: todo caminho da zona, exceto `/login`, `/api/*` e `/internal/*`, redireciona para `/account/login?next=<path>` se não houver `lab_user`. Rotas `/api/*` cuidam do 401 sozinhas (Task 11).
- O catálogo tem o próprio `getSessionUserId()` em `apps/catalog/lib/session.ts`, lendo o mesmo cookie. É um helper de poucas linhas, e duplicar sai mais barato que criar um pacote.

- [ ] **Step 1: `e2e/auth.spec.ts`** (falha): `/account/orders` sem cookie → URL termina em `/account/login?next=%2Forders`; escolher "Ana" e enviar → chega em `/account/orders` e o header mostra "Ana"; logout → volta para o login.
- [ ] **Step 2–4: Run → FAIL, implementar, Run → PASS.** O header do `account` e do `catalog` recebe `userSlot` com o nome do usuário, lido abaixo de `await navigation()` e dentro de `<Suspense>`, para não sujar o App Shell.
- [ ] **Step 5: Commit** `feat: fake cookie login and account proxy`.

---

### Task 8: Catálogo — root params, Cache Components, ISR, erros

**Files:**
- Create/Modify: `apps/catalog/app/catalog/[lang]/{layout.tsx,page.tsx,not-found.tsx}`, `.../products/[id]/{page.tsx,opengraph-image.tsx}`, `.../products/[id]/StockBlock.tsx`, `.../products/[id]/StockErrorBoundary.tsx`, `apps/catalog/lib/{i18n.ts,data.ts}`, `apps/catalog/app/catalog/api/lab/faults/route.ts`, `e2e/catalog.spec.ts`, `docs/features/{root-params,cache-components,isr-shell,catch-error,image-response}.md`

**Interfaces:**
- Consumes: `@lab/db` (Task 4), `tags` (Task 5), `@lab/ui` (Task 6).
- Produces:
  ```ts
  // lib/data.ts — cada uma com 'use cache' + cacheTag + cacheLife
  getProductList(): Promise<Product[]>        // lê lang() de next/root-params; cacheTag(tags.products()); cacheLife('hours')
  getProductDetail(id: number): Promise<Product | null> // cacheTag(tags.product(id)); cacheLife('hours')
  getProductStock(id: number): Promise<number>          // cacheTag(tags.stock(id)); cacheLife('minutes')
  // lib/i18n.ts
  t(key: 'catalog' | 'reviews' | 'loadingReviews' | 'inStock' | 'retry' | 'stockUnavailable', vars?: { n?: number }): Promise<string>  // usa lang()
  ```
  - Textos fixos (pt / en): `catalog` "Catálogo" / "Catalog"; `reviews` "Avaliações" / "Reviews"; `loadingReviews` "Carregando avaliações…" / "Loading reviews…"; `inStock` "{n} em estoque" / "{n} in stock"; `retry` "Tentar de novo" / "Try again"; `stockUnavailable` "Estoque indisponível" / "Stock unavailable". (O h1 "Catalog" da Task 2 passa a ser `t('catalog')`; atualizar o assert de `zones.spec.ts` para `/Catálogo|Catalog/`.)
  - O layout raiz `app/catalog/[lang]/layout.tsx` chama `notFound()` se `lang()` não estiver em `LANGS`, e exporta `ensureStatic = 'prefetch'`.
  - `products/[id]/page.tsx`: `generateStaticParams` retorna só os ids 1–3 (os demais usam o shell instantâneo do ISR); `notFound()` quando `getProductDetail` retorna `null`.
  - `StockErrorBoundary = catchError(Fallback)` de `next/error`. O fallback mostra `t('stockUnavailable')` e um botão `t('retry')` que chama `retry()`.
  - `POST /catalog/api/lab/faults` com body `{ key: 'stock', count: number }` chama `injectFault` (só para demo e e2e).
  - `opengraph-image.tsx` usa `ImageResponse` com o nome e o preço do produto.

- [ ] **Step 1: `e2e/catalog.spec.ts`** (falha):

```ts
test('lang root param localizes deep components', ...)   // /catalog/pt → texto "Avaliações" no detalhe; /catalog/en → "Reviews"
test('unsupported lang is 404', ...)                     // /catalog/xx → status 404
test('unknown product is 404, not the stock error UI', ...) // /catalog/pt/products/9999 → 404; sem texto de stockUnavailable
test('non-prerendered product serves and then caches', ...) // /catalog/pt/products/10 → 200 com h1 do produto
test('stock error boundary retries the server component', async ({ page, request }) => {
  await request.post('/catalog/api/lab/faults', { data: { key: 'stock', count: 1 } });
  await page.goto('/catalog/pt/products/4');
  await expect(page.getByText('Estoque indisponível')).toBeVisible();
  await page.getByRole('button', { name: 'Tentar de novo' }).click();
  await expect(page.getByText(/em estoque/)).toBeVisible();
});
test('opengraph image is generated', ...)                 // GET /catalog/pt/products/1/opengraph-image → 200, content-type image/png
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implementar** conforme as interfaces. **Step 4: Run** → PASS.
- [ ] **Step 5: Notas em `docs/features/`** (uma por funcionalidade: o que é, versão, onde no código, como observar).
- [ ] **Step 6: Commit** `feat: catalog with root params, cache components, ISR shell and catchError`.

---

### Task 9: Catálogo — prefetch, navegação instantânea, View Transitions, glob

**Files:**
- Create/Modify: `apps/catalog/app/catalog/[lang]/page.tsx` (links com `prefetch`), `.../products/[id]/Reviews.tsx`, `.../products/[id]/Related.tsx`, `.../guides/{page.tsx,[slug]/page.tsx}`, `apps/catalog/content/guides/*.md` (3 arquivos), `apps/catalog/next.config.ts` (loader de `.md` no `turbopack.rules`), `e2e/instant.spec.ts`, `docs/features/{partial-prefetching,navigation-prefetch,instant-test,view-transitions,glob-imports}.md`

**Interfaces:**
- Consumes: `getProductDetail`, `listReviews`, `getRecommendations`.
- Produces:
  - Lista: `<Link href=... prefetch transitionTypes={['slide']}>` para cada produto.
  - Detalhe: nome/preço no prefetch por link; `Reviews` faz `await navigation()` antes de ler os dados (fica fora do prefetch); `Related` faz `await prefetch()` (fica fora do App Shell, entra no prefetch por link). Os dois ficam dentro de `<Suspense>` com fallbacks `t('loadingReviews')` / "Loading related…".
  - `<ViewTransition>` (React 19.3) envolvendo o título do produto na lista e no detalhe, com o mesmo `name={`product-${id}`}`.
  - Fragment Ref (React 19.3): no detalhe, um botão "Ver avaliações" usa um `ref` num `<Fragment>` que envolve a seção de reviews para rolar até ela e dar foco (`scrollIntoView` / `focus` via a API de Fragment Refs).
  - `guides/page.tsx` usa `import.meta.glob('../../../../content/guides/*.md', { eager: true, query: '?raw' })` (ajustar à sintaxe aceita pela 16.4.3) para listar os guias.

- [ ] **Step 1: `e2e/instant.spec.ts`** (falha), usando `instant` de `@next/playwright`:

```ts
test('product title is instant, reviews stream after navigation', async ({ page }) => {
  await page.goto('/catalog/pt');
  await instant(page, async () => {
    await page.getByRole('link', { name: /Produto 2/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Produto 2');
    await expect(page.getByText('Carregando avaliações…')).toBeVisible();
  });
  await expect(page.getByTestId('review').first()).toBeVisible();
});
test('guides list comes from markdown files', ...)   // /catalog/pt/guides → 3 itens
```

  (Nomes "Produto N" vêm do seed da Task 4: nome pt de cada produto = `Produto ${id}`, en = `Product ${id}`.)
- [ ] **Step 2: Run** → FAIL. **Step 3: Implementar.** **Step 4: Run** → PASS.
- [ ] **Step 5: Notas**, incluindo como usar Instant Insights e o Navigation Inspector no DevTools do `next dev`, e a aba Network mostrando o prefetch inlining.
- [ ] **Step 6: Commit** `feat: partial prefetching, navigation stages and view transitions in catalog`.

---

### Task 10: Conta — Server Actions, `updateTag`, `refresh`, parallel route, offline

**Files:**
- Create: `apps/account/app/{layout.tsx,page.tsx}`, `app/orders/{page.tsx,actions.ts}`, `app/@modal/{default.tsx,(.)orders/[id]/page.tsx}`, `app/orders/[id]/page.tsx`, `app/profile/{page.tsx,actions.ts}`, `app/notifications/{page.tsx,actions.ts}`, `app/components/{NotificationBadge.tsx,OfflineBanner.tsx,PlaceOrderButton.tsx}`, `apps/account/lib/data.ts`, `e2e/account.spec.ts`, `docs/features/{update-tag,refresh,parallel-routes,offline}.md`
- Modify: `apps/account/next.config.ts` (`experimental.useOffline: true`)

**Interfaces:**
- Consumes: `requireUserId` (Task 7), `@lab/db`, `tags`, `broadcastInvalidation` (Task 5).
- Produces (Server Actions em `'use server'`):
  ```ts
  updateProfileAction(formData: FormData): Promise<void>   // updateProfile; updateTag(tags.userProfile(id)); broadcast mesmo tag
  placeOrderAction(): Promise<{ orderId: number } | { error: 'Cart is empty' }>
      // placeOrder; updateTag(userOrders, userCart, userNotifications); broadcast stock:<id> de cada linha + userNotifications + userCart
  markReadAction(id: number): Promise<void>               // markNotificationRead; refresh(); broadcast userNotifications
  ```
  - `markReadAction` usa `refresh()` porque a contagem no header **não** é cacheada na conta: ela é lida a cada request dentro de `<Suspense>`. Na conta, `refresh()` é o que atualiza o badge; o broadcast continua necessário para o catálogo, onde o badge é cacheado com `cacheTag(tags.userNotifications(id))`.
  - `@modal/default.tsx` retorna `null` (obrigatório na 16.x); o modal intercepta `/orders/[id]`.
  - `OfflineBanner` (`useOffline` de `next/offline`) fica no layout; `PlaceOrderButton` usa `useTransition` e mostra "Placing order (offline, will retry)…" quando `pending && isOffline`.

- [ ] **Step 1: `e2e/account.spec.ts`** (falha):

```ts
test('profile edit shows new name immediately (updateTag)', ...)       // muda para "Ana Lab" → header mostra "Ana Lab" sem reload
test('marking notification read updates header badge (refresh)', ...) // badge 1 → 0
test('order detail opens as modal from list and as page on reload', ...)
test('logged-out server action redirects to login', ...)               // limpar cookie e submeter perfil → URL /account/login
test('place order while offline completes when back online', async ({ page, context }) => {
  // login, item no carrinho via API; ir para /account/orders
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Place order' }).click();
  await expect(page.getByText('Placing order (offline, will retry)…')).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByTestId('order-row').first()).toBeVisible();
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implementar.** **Step 4: Run** → PASS.
- [ ] **Step 5: Notas**, incluindo um print/trecho do log de Server Functions que o `next dev` mostra no terminal (nome, argumentos, tempo, arquivo) ao rodar `placeOrderAction`. **Step 6: Commit** `feat: account zone with server actions, updateTag, refresh and offline support`.

---

### Task 11: Widgets reais (carrinho e recomendações) + API do carrinho

**Files:**
- Create: `apps/account/app/api/cart/route.ts`, `apps/catalog/app/catalog/api/recommendations/route.ts`, `apps/widgets/src/{CartWidget.tsx,Recommendations.tsx}`, `apps/catalog/app/catalog/[lang]/products/[id]/AddToCart.tsx`, `e2e/widgets.spec.ts`
- Modify: `apps/widgets/rsbuild.config.ts` (`exposes` com `./CartWidget` e `./Recommendations`), `@lab/mf-host` (`name` aceita os novos widgets), headers do catálogo e da conta (`cartSlot={<RemoteWidget name="CartWidget" />}`), detalhe do produto (`<RemoteWidget name="Recommendations" props={{ excludeId }} />`)

**Interfaces:**
- Produces:
  - `GET /account/api/cart` → `{ lines: CartLine[]; totalCents: number }`; `POST` com `{ productId, qty }` → mesmo formato; `DELETE ?productId=` → mesmo formato. Sem cookie → **401** `{ error: 'unauthenticated' }`. `POST`/`DELETE` chamam `revalidateTag(tags.userCart(id), { expire: 0 })` e fazem broadcast.
  - `GET /catalog/api/recommendations?exclude=<id>` → `{ products: { id, name, priceCents, href }[] }` (4 itens).
  - Evento de janela `lab:cart-changed` (`CustomEvent<{ count: number }>`), disparado pelo `AddToCart` e pelo `CartWidget`; o `CartWidget` refaz o GET quando o recebe.
  - Props: `CartWidget` sem props; `Recommendations` `{ excludeId?: number }`.

- [ ] **Step 1: `e2e/widgets.spec.ts`** (falha): logado, adicionar o produto 5 no detalhe → o `CartWidget` no header passa a mostrar "1"; navegar (link `<a>`) para `/account` → o `CartWidget` também mostra "1" (mesmo widget, outra zona); o bloco de recomendações do produto 5 lista 4 itens sem o 5; `GET /account/api/cart` sem cookie → 401.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implementar.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat: cart and recommendations widgets federated across zones`.

---

### Task 12: Coerência de cache entre zonas (os três casos)

**Files:**
- Create: `apps/catalog/app/catalog/[lang]/admin/{page.tsx,actions.ts}`, `e2e/coherence.spec.ts`
- Modify: `docs/features/cross-zone-cache.md`

**Interfaces:**
- Consumes: tudo da Task 5; `placeOrderAction`, `markReadAction` (Task 10).
- Produces: `setPriceAction(formData: FormData)` no catálogo, com campos `productId` e `priceCents`. Faz `setPrice`, `revalidateTag(tags.product(id), 'max')` local (demonstra o stale-while-revalidate) e broadcast de `product:<id>`. A conta marca linhas de carrinho/pedido com `cacheTag(tags.product(id))`.

- [ ] **Step 1: `e2e/coherence.spec.ts`** (falha):

```ts
test('order placed in account updates stock shown in catalog', ...)   // estoque 5 → compra 2 → /catalog/pt/products/6 mostra 3
test('price change in catalog updates cart total in account', ...)    // produto 7 no carrinho; admin muda preço; /account mostra o novo total
test('reading a notification updates the catalog header badge', ...)  // badge no catálogo 1 → ler na conta → catálogo mostra 0
test('catalog price change serves stale once then fresh (SWR)', ...)  // após setPrice, 1ª visita ao detalhe no catálogo pode mostrar o preço antigo; a seguinte mostra o novo
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implementar.** **Step 4: Run** → PASS.
- [ ] **Step 5: Atualizar a nota** com o diagrama do fluxo (quem invalida o quê) e o resultado do teste com uma zona parada.
- [ ] **Step 6: Commit** `feat: cross-zone cache coherence scenarios`.

---

### Task 13: Página-laboratório de erros + ícones + `ensureStatic` no shell

**Files:**
- Create: `apps/catalog/app/catalog/[lang]/lab/errors/{page.tsx,HydrationMismatch.tsx}`, `apps/shell/app/{icon.png,icon.svg}`, `e2e/shell.spec.ts`
- Modify: `apps/shell/app/page.tsx` (`export const ensureStatic = 'navigation'`)

**Interfaces:**
- Produces: `/catalog/[lang]/lab/errors` com dois botões: um provoca erro com `Error.cause` encadeado (3 níveis) e o outro renderiza um componente com hydration mismatch proposital (`Date.now()` no render). A página só é usada em `next dev`, onde o overlay mostra a diferença; em produção, ela exibe um aviso.

- [ ] **Step 1: `e2e/shell.spec.ts`** (falha): o `<head>` de `/` tem dois `<link rel="icon">` (png e svg); `/` responde com `x-nextjs-prerender` ou equivalente indicando que é estático (adaptar ao header que a 16.4.3 emitir).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implementar.** **Step 4: Run** → PASS.
- [ ] **Step 5: Verificação manual registrada em nota.** Colocar `cookies()` na home do shell e rodar `pnpm --filter shell build` → Expected: build falha com o erro de `ensureStatic`. Desfazer a mudança e colar a mensagem real em `docs/features/ensure-static.md`.
- [ ] **Step 6: Commit** `feat: ensureStatic home, multi-format icons and error lab page`.

---

### Task 14: Flags de ferramenta e compilador

**Files:**
- Modify: `apps/catalog/next.config.ts` (`reactCompiler: true`, `experimental.turbopackRustReactCompiler: true`), `apps/account/next.config.ts` (`experimental.turbopackGc: true`, `experimental.turbopackLazyDynamicImports: true`, `experimental.turbopackPluginRuntimeStrategy: 'workerThreads'`), `apps/shell/next.config.ts` (`experimental.agentUpgrade: 'security'`), `package.json` dos apps (scripts `dev:inspect` = `next dev --inspect`, `start:inspect` = `next start --inspect`), `apps/account/app/orders/PlaceOrderButton.tsx` (`import('canvas-confetti')` dinâmico após o pedido, para o lazy dynamic import)
- Create: `docs/features/{react-compiler,turbopack-flags,typescript-7,bundle-analyzer,inspect,agents}.md`

- [ ] **Step 1: Run `pnpm build`** com as flags → Expected: os 4 apps fazem build. Registrar na nota o tempo de type-check com TypeScript 7.
- [ ] **Step 2: Run `pnpm --filter account dev`** e anotar se o log indica o fallback de worker threads para child processes no Node 26. Colar a linha real na nota.
- [ ] **Step 3: Run `pnpm analyze`** → Expected: o Bundle Analyzer abre. Registrar a rota de maior peso e o efeito do `import('canvas-confetti')` lazy.
- [ ] **Step 4: Run `pnpm e2e`** (suíte completa) → Expected: PASS. As flags não podem quebrar nada.
- [ ] **Step 5: Commit** `chore: enable compiler and turbopack experimental flags`.

---

### Task 15: README como mapa de estudo

**Files:**
- Create: `README.md`
- Modify: `docs/features/*.md` (revisão final)

- [ ] **Step 1: README** com:
  - como rodar (`pnpm install`, `pnpm db:reset`, `pnpm dev`, `pnpm prod`, `pnpm e2e`) e a tabela de portas;
  - um diagrama ASCII da arquitetura (shell → zonas → widgets);
  - **a matriz de funcionalidades** (funcionalidade | versão | estável/experimental | onde no código | como observar | nota), com versão e status **conferidos no release instalado** (`node_modules/next/dist/docs` ou o `AGENTS.md` gerado pelo `next dev`), não copiados do spec;
  - a seção "Module Federation é um contorno", com a estratégia que venceu o spike;
  - as limitações conhecidas (aviso de invalidação perdido com zona fora do ar; offline só em produção).
- [ ] **Step 2: Conferir que cada linha da matriz do spec tem uma linha no README e uma nota em `docs/features/`.** Run: `ls docs/features | wc -l` → Expected: ≥ 25.
- [ ] **Step 3: Run `pnpm test && pnpm build && pnpm e2e`** → Expected: tudo PASS.
- [ ] **Step 4: Commit** `docs: study map README and feature notes`.
