# next16-microfrontends-lab — design

## Intenção

Projeto pessoal de estudo do Victor (nada da Merx: as regras, repos e convenções da Merx não se aplicam aqui). Serve para dois objetivos:

1. **Exercitar as novidades da linha Next.js 16.x (16.0 → 16.4)** de forma que cada funcionalidade apareça em algum lugar do app e dê para *ver* funcionando.
2. **Entender microfrontend na prática**, comparando as duas formas de composição:
   - **Multi-Zones** (composição por página, o caminho oficial do Next).
   - **Module Federation** (composição por componente em runtime), que hoje não roda dentro do Next 16 App Router/Turbopack. Por isso entra como um app separado, carregado só no navegador.

O domínio do app é pretexto: o foco é cobrir as funcionalidades.

## Objetivos

- Cobrir as funcionalidades listadas na matriz abaixo, cada uma observável (no browser, no DevTools do Next, no terminal ou num teste).
- Mostrar Multi-Zones e Module Federation lado a lado, com a diferença entre os dois ficando evidente para quem navega e para quem lê o código.
- Rodar tudo localmente com um comando (`pnpm dev`) e ficar pronto para subir num repo do GitHub do Victor.
- Ter um README que funcione como mapa de estudo: funcionalidade → versão em que entrou → estável/experimental → onde está no código → como observar.

## Não-objetivos

- Deploy em qualquer lugar (Vercel, Docker, cloud). Só local + GitHub.
- CI/CD (GitHub Actions é opcional e fica fora do escopo inicial).
- Autenticação real, pagamento real, segurança de produção.
- Pages Router e o plugin `@module-federation/nextjs-mf` (só suporta Pages Router e está em manutenção).
- Design visual caprichado: basta um design system simples e consistente.

## Anti-objetivos (falharia mesmo "funcionando")

- Funcionalidade ligada por flag sem nenhum lugar onde ela se manifeste: um checklist invisível não ensina nada.
- Apresentar o Module Federation como se fosse suportado oficialmente pelo Next. O README deve dizer claramente que é um contorno e por quê.
- Domínio inchado: regra de negócio que não serve para demonstrar nenhuma funcionalidade.

## Restrições

- **Local:** `~/Projects/next16-microfrontends-lab`. Node local é v26.12.1, pnpm 12.15.0.
- **Next.js:** última 16.4.x disponível (inclui os patches de segurança de setembro/outubro 2026). React 19.3. Versões fixadas (sem `^`).
- **Monorepo:** pnpm workspaces + Turborepo.
- **Sem serviços externos:** dados em SQLite local, login falso.
- **Portas fixas:** shell 3000, zona catálogo 3001, zona conta 3002, remote Module Federation 3003. O usuário acessa sempre `http://localhost:3000`.
- Atenção a um efeito do Node 26: `turbopackPluginRuntimeStrategy: 'workerThreads'` cai para child processes no Node ≥ 24.13.1 por causa de um bug do Node. Isso deve ser documentado como observação, não contornado.

## Decisões tomadas (com o Victor)

- Projeto pessoal, fora da Merx.
- Domínio indiferente; o foco é cobrir as funcionalidades.
- Só local; depois sobe para o GitHub.
- Usar **Multi-Zones e Module Federation** no mesmo projeto.
- O Module Federation fica num **app que não é Next** e é carregado **só no navegador**, sem SSR (aprovado explicitamente).
- Pasta `~/Projects/next16-microfrontends-lab`.
- Cache sincronizado entre zonas (ver "Coerência de cache entre zonas").

## Decisões minhas (o Victor pode trocar)

- **Domínio:** uma loja fictícia ("Lab Store"), com catálogo de produtos, conta/pedidos e carrinho.
- **Dados:** SQLite local num pacote compartilhado, com atraso artificial configurável por query. O atraso faz loading states, Suspense e cache ficarem visíveis.
- **Login:** falso, por cookie (escolher um usuário de uma lista). Existe só para haver conteúdo personalizado e dinâmico.
- **Idioma:** código, nomes e testes em inglês; README e docs de estudo em português.
- **React no widget MF:** primeiro tentar compartilhar o React do host com o widget (singleton no shared scope). Atenção: o App Router usa o React empacotado pelo próprio Next, não o pacote `react` instalado, e é isso que torna o compartilhamento difícil. Se não der, o remote expõe `mount(el, props)` e monta o widget com o React dele, ainda carregado pelo runtime do Module Federation. O README registra qual caminho funcionou e por quê. Rodar zona em webpack ou usar iframe **não** são saídas aceitas.
- **Matriz contra a versão real:** a matriz foi montada a partir dos posts oficiais de 16.0 a 16.4. Se na 16.4.x instalada uma API tiver outro nome, outra flag ou outro status, adaptar e registrar no README. As colunas de versão e status do README vêm do release instalado, não deste documento. Uma linha só cai se a API não existir, e isso é avisado ao Victor.
- **Dois modos de execução:** `pnpm dev` para desenvolver, e `pnpm prod` (build + start dos 4 apps) para observar o que só aparece em produção: prefetch, Partial Prefetching, prefetch inlining, shell de ISR e `revalidateTag` servindo conteúdo antigo. O Playwright roda contra o modo produção.

## Arquitetura

```
next16-microfrontends-lab/
  apps/
    shell/        Next 16.4  :3000  casca: home, layout, rotas para as zonas
    catalog/      Next 16.4  :3001  zona /catalog/*  (assetPrefix próprio)
    account/      Next 16.4  :3002  zona /account/*  (assetPrefix próprio)
    widgets/      React 19 + Rsbuild :3003  remote Module Federation
  packages/
    ui/           design system (componentes + CSS Modules)
    db/           SQLite: schema, seed, helpers com atraso artificial
    tsconfig/     configs TS compartilhadas
  e2e/            Playwright (inclui @next/playwright instant())
  docs/features/  uma nota por funcionalidade
```

### Multi-Zones

- `shell` atende `/` e tudo que não é de outra zona. Encaminha `/catalog/*` e `/account/*` (e os assets com prefixo de cada zona) via `rewrites` para `localhost:3001`/`3002`.
- `shell` também tem um `proxy.ts` com uma decisão de roteamento **dinâmica** (ex.: um cookie de feature flag que manda `/catalog/sale` para uma variante). Isso demonstra quando usar `proxy.ts` em vez de `rewrites`.
- Links entre zonas usam `<a>` (navegação "dura"); links dentro da mesma zona usam `<Link>` (navegação "suave"). O README deve apontar onde se vê essa diferença.
- Server Actions nas zonas configuram `serverActions.allowedOrigins` para `localhost:3000`.
- O cabeçalho/rodapé vem de `packages/ui` e é renderizado em cada zona, para o site parecer um só.

### Module Federation

- `widgets` é um app React 19 com Rsbuild + plugin oficial do Module Federation 2.0. Expõe pelo menos dois componentes: `CartWidget` (mini-carrinho) e `Recommendations` (lista de sugestões). Também roda sozinho em `:3003` para desenvolvimento isolado.
- As zonas `catalog` e `account` carregam esses widgets **em runtime, no navegador**, num Client Component, usando o runtime do Module Federation (`@module-federation/enhanced/runtime` ou equivalente). React e ReactDOM são compartilhados como singleton, para que o widget use a mesma instância do host.
- O mesmo widget aparece nas duas zonas: isso mostra que composição por componente atravessa zonas, ao contrário das páginas.
- O carrinho é persistido no SQLite e acessado por uma rota de API da zona `account` (passando pelo `shell`, mesma origem).

### Coerência de cache entre zonas

Cada zona é um processo Next com cache próprio: `updateTag`/`revalidateTag` só invalidam a zona que os chama. Decisão do Victor: **sincronizar as zonas**.

- Cada app Next (shell, catalog, account) expõe um endpoint interno de invalidação que recebe uma lista de tags e chama `revalidateTag` localmente. O endpoint é protegido por um segredo compartilhado via variável de ambiente e não é roteado pelo `shell` para o público.
- Quem faz a mudança invalida o próprio cache (`updateTag`, para read-your-writes) e avisa as outras zonas.
- As tags são um vocabulário compartilhado, definido num pacote (ex.: `product:<id>`, `stock:<id>`, `user:<id>:notifications`).
- Casos que precisam funcionar: pedido em `account` atualiza o estoque mostrado em `catalog`; mudança de preço em `catalog` atualiza o total do carrinho/pedidos em `account`; ler notificação atualiza o contador do header em todas as zonas.
- O README explica o problema, a solução e o que acontece se uma zona estiver fora do ar quando o aviso é enviado: o aviso se perde e o cache dela expira pelo `cacheLife`. Não precisa de fila nem de retry.
- **Risco principal do projeto:** a integração do runtime do MF com Turbopack + React 19.3 no host. Deve ser validada primeiro, num marco inicial isolado (ver "Ordem sugerida").

## Matriz de funcionalidades

Cada linha precisa de um lugar no app e de um jeito de observar.

| Funcionalidade | Versão | Status | Onde | Como observar |
|---|---|---|---|---|
| Turbopack como bundler padrão | 16.0 | estável | todos os apps Next | saída do `next dev`/`build` |
| Cache Components (`cacheComponents`, `'use cache'`, `cacheLife`, `cacheTag`) | 16.0 → 16.4 | estável | catalog (lista/detalhe), account (perfil) | página mistura conteúdo estático e dinâmico; logs de render |
| `proxy.ts` (antigo middleware) | 16.0 | estável | shell (flag de rota), account (exigir login) | redireciona sem cookie; variante por flag |
| `updateTag()` (read-your-writes) | 16.0 | estável | account: editar perfil / fazer pedido | mudança aparece na hora |
| `refresh()` em Server Action | 16.0 | estável | account: marcar notificação como lida | contador do header atualiza sem tocar no cache |
| `revalidateTag(tag, profile)` | 16.0 | estável | catalog: ação de "admin" que muda preço | conteúdo antigo servido e trocado em background |
| React Compiler (`reactCompiler`) | 16.0 | estável | uma das zonas | comparação de re-renders no React DevTools |
| Async `params`/`searchParams`/`cookies()` | 16.0 | breaking | todo o código | — (padrão do código) |
| Parallel routes com `default.js` | 16.0 | breaking | account (ex.: modal de pedido) | build falha sem o `default.js` |
| `next dev --inspect` / `next start --inspect` | 16.1 / 16.2 | estável | scripts | debugger do Chrome |
| Bundle Analyzer (`next experimental-analyze`) | 16.1 → 16.4 | experimental | script na raiz | UI do analisador, snapshots e diff |
| Server Function logging | 16.2 | estável | qualquer Server Action | terminal do `next dev` |
| Hydration diff / `Error.cause` no overlay | 16.2 | estável | página de demonstração que provoca o erro de propósito | overlay de erro |
| `transitionTypes` no `<Link>` + View Transitions | 16.2 / React 19.3 | estável | catalog: lista → detalhe | animação na navegação |
| `ImageResponse` (OG image) | 16.2 | estável | catalog: imagem OG do produto | abrir `/catalog/.../opengraph-image` |
| Ícones em múltiplos formatos (`icon.png` + `icon.svg`) | 16.2 | estável | shell | dois `<link>` no `<head>` |
| Instant Navigations: Partial Prefetching (`partialPrefetching`) | 16.3 | opt-in | catalog | navegação sem loading |
| Instant Insights + Navigation Inspector | 16.3 | DevTools | catalog/account | painel do DevTools do Next |
| `instant()` do `@next/playwright` | 16.3 | estável | e2e | teste falha se a navegação deixar de ser instantânea |
| ISR com shell instantâneo (`generateStaticParams` parcial) | 16.3 | opt-in | catalog: detalhe do produto | 1º acesso a produto não pré-renderizado mostra shell |
| `catchError` + `retry()` | 16.3 | estável | catalog: bloco de "estoque" que falha aleatoriamente | botão "tentar de novo" refaz o Server Component |
| Root params (`next/root-params`) | 16.3 | estável | catalog com `[lang]` (`/catalog/pt/...`, `/catalog/en/...`) | componente profundo lê o idioma sem prop |
| `import.meta.glob` | 16.3 | estável | catalog: textos editoriais em `.md` | lista gerada a partir dos arquivos |
| Prefetch inlining | 16.3 | estável | automático | aba Network: menos requests de prefetch |
| `useOffline` (`experimental.useOffline`) | 16.3 | experimental | account | banner offline; ação fica pendente e completa ao voltar a rede |
| TypeScript 7 no `next build` | 16.3 | estável | todos os apps | tempo de type-check no build |
| `ensureStatic` (`shell`/`prefetch`/`navigation`) | 16.4 | estável | shell (home `'navigation'`), catalog (`'prefetch'`) | build quebra se um componente dinâmico entrar |
| `navigation()` / `prefetch()` de `next/cache` | 16.4 | estável | catalog: avaliações do produto adiadas para a navegação | aba Network do prefetch vs navegação |
| React 19.3 (View Transitions, Fragment Refs estáveis) | 16.4 | estável | catalog | animação; foco/scroll via Fragment Ref |
| Rust React Compiler (`turbopackRustReactCompiler`) | 16.3/16.4 | experimental | mesma zona do React Compiler | tempo de compilação |
| `turbopackGc`, `turbopackLazyDynamicImports` | 16.4 | experimental | uma zona | tamanho do cache / compilação sob demanda de um `import()` pesado |
| `turbopackPluginRuntimeStrategy: 'workerThreads'` | 16.4 | experimental | documentado | registrar o fallback no Node 26 |
| `agentUpgrade` / `AGENTS.md` versionado | 16.3/16.4 | experimental | config + arquivo gerado | aviso no `next dev`; bloco no `AGENTS.md` |

Status "opt-in" significa que exige `cacheComponents: true` + `partialPrefetching: true`, que devem estar ligados nas zonas.

## O que fica com quem constrói

- Escolha entre `node:sqlite` e `better-sqlite3`, e o desenho do schema.
- Rotas exatas, componentes e textos de tela.
- Distribuição de flags experimentais entre as zonas, desde que cada uma tenha um lugar onde se manifeste.
- Ferramentas de teste unitário (Vitest ou nenhum). O mínimo exigido é a suíte Playwright cobrindo navegação entre zonas, o carregamento dos widgets MF e pelo menos um teste com `instant()`.
- Lint/format (Biome ou ESLint flat config).

## Ordem sugerida

1. Monorepo + `shell` + duas zonas vazias com rewrites funcionando em `localhost:3000`.
2. **Spike do Module Federation:** `widgets` + um widget carregado numa zona. Se não funcionar com Turbopack, parar e voltar ao Victor antes de seguir.
3. `packages/db` + `packages/ui`.
4. Zona `catalog` com as funcionalidades de cache/prefetch/navegação.
5. Zona `account` com Server Actions, `updateTag`, `refresh`, `useOffline`.
5b. Invalidação entre zonas (endpoint + vocabulário de tags) e os três casos de coerência.
6. Testes e2e, README com a matriz e notas em `docs/features/`.
