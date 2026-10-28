# UX e modo estudo — design

## Por quê

O lab funciona (77 e2e verdes), mas na tela é inutilizável. Fora dos cinco componentes do `@lab/ui`, as páginas usam o estilo padrão do navegador: Times, links azuis, listas com bolinha. O fluxo não se explica sozinho e mistura inglês com português. O Victor quer duas coisas:

1. **Usabilidade.** Dá para entender o app e o fluxo dele sem ler código.
2. **Instrutivo.** O próprio app ensina os pontos de estudo de microfrontends e de Next 16: mostra o que está acontecendo, onde e por quê.

## Não-objetivos

- Mudar o comportamento de qualquer funcionalidade. Cache, rotas, Server Actions, MF, tags e proxies ficam como estão; os e2e são a rede de segurança.
- Biblioteca de UI externa (Tailwind, shadcn etc.). Continua com CSS Modules + uma folha global no `@lab/ui`.
- Deploy ou responsividade caprichada. Desktop primeiro, e o layout não pode quebrar em telas estreitas.

## Parte A — Camada visual e fluxo

- **Base global (`@lab/ui`):** fonte do sistema, escala tipográfica, container centralizado (~1100px), espaçamento consistente, links sem sublinhado padrão, foco visível e tokens de cor. Cada zona tem uma cor própria: shell neutro/cinza-azulado, catálogo azul, conta verde, widgets federados roxo. A folha é importada no layout raiz das três zonas.
- **Header:** marca "Lab Store", navegação (Início / Catálogo / Minha conta) com a zona ativa destacada, uma faixa fina na cor da zona e um chip "zona: catálogo · :3001". À direita ficam o carrinho federado e, para quem está logado, a notificação, o nome e Sair; para quem não está, Entrar.
- **Textos em português** em todas as zonas. O catálogo mantém pt/en por `[lang]`. Shell e conta passam a ser pt. Os seletores e textos dos e2e acompanham a troca, sem enfraquecer nenhuma asserção.
- **Shell (início):** hero curto explicando o lab, diagrama visual da arquitetura (blocos coloridos: shell → catálogo / conta, widgets :3003, SQLite, endpoints internos) e o roteiro de estudo (Parte B). Continua `ensureStatic = 'navigation'`, sem cookies.
- **Catálogo:**
  - lista em grid de cards: nome, preço, link;
  - detalhe em duas colunas: título, preço, estoque e Adicionar ao carrinho; ao lado, o "O que observar aqui";
  - abaixo do detalhe: avaliações, relacionados, populares e o widget de recomendações, cada um como uma seção com título;
  - guias como cards;
  - admin como formulário claro;
  - laboratório de erros com explicação.
- **Conta:**
  - login com usuários como cartões clicáveis (Ana, Bruno, Carla);
  - início da conta como painel de cartões (Pedidos, Perfil, Notificações, com contagens);
  - pedidos: carrinho em tabela (produto, qtd, preço, subtotal, total), botão Fazer pedido e histórico em tabela;
  - o modal do pedido com aparência de modal de verdade, sem cobrir o header;
  - perfil como formulário;
  - notificações em lista com estado lida/não lida e botão Marcar como lida;
  - banner offline visível.
- **Widgets federados:** o mesmo visual (tokens), com borda e estilo próprios.
- **Estados vazios e de carregamento** com texto útil: "Seu carrinho está vazio. Ver catálogo →" e esqueletos simples em vez de "Loading…".

## Parte B — Modo estudo (instrutivo)

Tudo em português.

1. **Roteiro de estudo na home do shell.** Seis passos em cartões, cada um com objetivo, o que fazer (clicar em X), o que observar e um link para a nota:
   1. Multi-Zones: navegação dura × suave entre zonas.
   2. Module Federation: o carrinho e as recomendações vêm de outro app (:3003).
   3. Cache Components + Partial Prefetching: o shell estático e as partes dinâmicas.
   4. Navegação instantânea: `prefetch()`/`navigation()`, `instant()`.
   5. Coerência de cache entre zonas: pedido → estoque, preço → carrinho, notificação → badge.
   6. Server Actions e offline: `updateTag`, `refresh()`, `useOffline`.
2. **Painel "Modo estudo"**, um botão flutuante presente nas três zonas que abre um painel lateral. É um componente cliente do `@lab/ui`. O estado ligado/desligado fica em `localStorage`, que é a mesma origem nas três zonas. Mostra:
   - Zona que serviu esta página, porta e como chegou: "rewrite do shell para :3001", com `assetPrefix` ou `basePath`.
   - Hora em que este documento foi carregado e o contador de navegações suaves desde então. Uma navegação dura entre zonas zera o contador, e o painel diz isso explicitamente: "documento novo — você atravessou uma zona".
   - Os widgets de Module Federation da página.
   - Link para as notas da página atual.
3. **Contorno dos widgets federados.** Com o modo estudo ligado, cada `RemoteWidget` ganha uma borda tracejada roxa e um rótulo "Module Federation · widgets@:3003 · CartWidget". Os limites de cada zona também ficam visíveis pela faixa colorida.
4. **"O que observar aqui".** Um bloco recolhível nas páginas-chave explica em 2 a 4 frases o que a página demonstra e como ver, com links para as notas:
   - produto: shell × dinâmico, estoque com `catchError`, avaliações após `navigation()`, populares com `prefetch()`, View Transition;
   - lista do catálogo;
   - guias (`import.meta.glob`);
   - admin (stale-while-revalidate × `updateTag`);
   - laboratório de erros;
   - login (`proxy.ts`);
   - pedidos (`navigation()` observável, `updateTag`, offline);
   - notificações (`refresh()`);
   - home do shell (`ensureStatic`).
5. **Eventos de cache visíveis.** As ações que invalidam cache passam a devolver também o resultado do broadcast: `placeOrderAction`, `markReadAction`, `updateProfileAction`, `setPriceAction` e a API do carrinho. A UI mostra um aviso, por exemplo: "Invalidado aqui: `updateTag(user:1:orders)` … · Avisado: shell ✓ · catálogo ✓". Se uma zona estiver fora do ar, o aviso mostra ✗ com o erro. É uma mudança só de retorno; as tags e a ordem das chamadas não mudam.
6. **Notas dentro do app.** O shell ganha `/estudo` (índice das notas por tema) e `/estudo/[slug]`, que renderiza `docs/features/<slug>.md` lido por `import.meta.glob` (raw) e um renderizador de markdown fixado em versão exata. As páginas são estáticas, via `generateStaticParams`. Os links "ver nota" do app apontam para cá.

## Restrições

- Versões exatas para qualquer dependência nova.
- Shell home continua estática com `ensureStatic = 'navigation'`. O catálogo continua com `ensureStatic = 'prefetch'` no layout. Nada do modo estudo pode ler cookies em componentes que sejam estáticos.
- Os testes que provam funcionalidades continuam provando o mesmo, inclusive as mutações das Tasks 9, 10 e 12. Só mudam textos e seletores.
- Código e identificadores em inglês; textos de tela e notas em português.
- Commits locais, sem push.
