import { type NoteSlug, noteHref, noteLabel, StudyNote } from "@lab/ui";
import type { ReactNode } from "react";
import styles from "./page.module.css";

export const ensureStatic = "navigation";

type StudyStep = {
  zone: "catalog" | "widgets" | "account";
  theme: string;
  title: string;
  goal: string;
  todo: ReactNode;
  observe: ReactNode;
  place: { href: string; label: string };
  notes: NoteSlug[];
};

const STUDY_STEPS: StudyStep[] = [
  {
    zone: "catalog",
    theme: "Multi-Zones",
    title: "Navegação dura × suave entre zonas",
    goal: "Ver que a loja são três apps Next e onde um termina e o outro começa.",
    todo: (
      <>
        Ligue o <strong>modo estudo</strong> (botão no canto inferior direito),
        abra o catálogo, clique em "Guias" e depois num guia. Em seguida, clique
        em "Minha conta" no topo.
      </>
    ),
    observe: (
      <>
        Dentro do catálogo o contador de navegações suaves do painel sobe. Na
        conta ele volta a zero e o painel avisa "documento novo — você
        atravessou uma zona"; a faixa do topo troca de cor.
      </>
    ),
    place: { href: "/catalog/pt", label: "Ir ao catálogo" },
    notes: ["multi-zones"],
  },
  {
    zone: "widgets",
    theme: "Module Federation",
    title: "Widgets que vêm de outro app",
    goal: "Ver um componente compartilhado por duas zonas sem rebuild delas.",
    todo: (
      <>
        Com o modo estudo ligado, abra o Produto 5 e role até "Recomendados".
        Deixe o DevTools › Network aberto.
      </>
    ),
    observe: (
      <>
        "Recomendados" e, com sessão, o carrinho do header ganham contorno roxo:
        vêm de <code>localhost:3003</code> (<code>mf-manifest.json</code> e
        chunks no Network). No código-fonte da página (Ctrl+U) eles não existem:
        só carregam no navegador.
      </>
    ),
    place: { href: "/catalog/pt/products/5", label: "Abrir o Produto 5" },
    notes: ["module-federation"],
  },
  {
    zone: "catalog",
    theme: "Cache Components + Partial Prefetching",
    title: "O que é estático e o que chega depois",
    goal: "Separar o shell estático das partes dinâmicas de uma página.",
    todo: (
      <>
        Abra o catálogo com DevTools › Network filtrado por <code>_rsc</code> e,
        antes de clicar, veja os prefetches. Depois clique num produto.
      </>
    ),
    observe: (
      <>
        Um <code>__PAGE__</code> por link com <code>prefetch</code> chega antes
        do clique. No produto, nome e preço aparecem na hora; estoque e
        avaliações chegam por streaming.
      </>
    ),
    place: { href: "/catalog/pt", label: "Ver os prefetches" },
    notes: ["cache-components", "partial-prefetching"],
  },
  {
    zone: "catalog",
    theme: "Navegação instantânea",
    title: "prefetch(), navigation() e instant()",
    goal: "Escolher em que etapa cada pedaço da página é carregado.",
    todo: (
      <>
        No Produto 2, clique num link de "Relacionados". Depois, com sessão, vá
        em Minha conta e clique em "Pedidos".
      </>
    ),
    observe: (
      <>
        "Populares" aparece como "Carregando populares…": o{" "}
        <code>prefetch()</code> o tirou do App Shell que um link comum carrega.
        Em Pedidos, o histórico espera a navegação (<code>navigation()</code>);
        no catálogo o <code>navigation()</code> não tem efeito visível. O{" "}
        <code>e2e/instant.spec.ts</code> prova os dois com{" "}
        <code>instant()</code>.
      </>
    ),
    place: { href: "/catalog/pt/products/2", label: "Abrir o Produto 2" },
    notes: ["navigation-prefetch", "instant-test"],
  },
  {
    zone: "account",
    theme: "Cache entre zonas",
    title: "Uma mutação, três processos",
    goal: "Ver uma mudança feita numa zona invalidar o cache das outras.",
    todo: (
      <>
        Entre como Ana, adicione um produto ao carrinho e faça o pedido. Depois
        mude o preço de um produto no Admin de preços e marque uma notificação
        como lida.
      </>
    ),
    observe: (
      <>
        Cada ação mostra um aviso de cache no canto: as tags invalidadas na zona
        e as zonas avisadas por broadcast (shell ✓ · catálogo ✓). O estoque no
        catálogo cai, o total do carrinho muda e o sino zera.
      </>
    ),
    place: { href: "/account/orders", label: "Ir para Pedidos" },
    notes: ["cross-zone-cache"],
  },
  {
    zone: "account",
    theme: "Server Actions e offline",
    title: "updateTag, refresh() e useOffline",
    goal: "Comparar as formas de atualizar a tela depois de uma Server Action.",
    todo: (
      <>
        Em Perfil, troque o nome. Em Notificações, marque uma como lida. Em
        Pedidos, ligue DevTools › Network › Offline e faça um pedido.
      </>
    ),
    observe: (
      <>
        <code>updateTag</code> faz o header mostrar o nome novo na hora;{" "}
        <code>refresh()</code> atualiza o sino sem tocar no cache; offline, o
        botão vira "Enviando pedido (offline, vai tentar de novo)…" e o pedido
        conclui quando a rede volta.
      </>
    ),
    place: { href: "/account/profile", label: "Abrir o Perfil" },
    notes: ["update-tag", "refresh", "offline"],
  },
];

export default function HomePage() {
  return (
    <main>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Laboratório de estudo · Next 16</p>
        <h1 className={styles.title}>Lab Store</h1>
        <p className={styles.lead}>
          Uma loja de mentira montada com três apps Next.js (Multi-Zones) e um
          remote de Module Federation. Cada pedaço da tela vem de um lugar
          diferente; o lab mostra de onde e por quê.
        </p>
        <div className={styles.actions}>
          <a href="/catalog/pt" className={styles.primary}>
            Explorar o catálogo
          </a>
          <a href="/account" className={styles.secondary}>
            Abrir minha conta
          </a>
          <a href="#roteiro" className={styles.tourCta}>
            Seguir o roteiro de estudo ↓
          </a>
        </div>
      </section>

      <StudyNote
        className={styles.studyNote}
        notes={["ensure-static", "multi-zones"]}
      >
        <p>
          Esta página é estática por contrato:{" "}
          <code>ensureStatic = 'navigation'</code> faz o <code>next build</code>{" "}
          falhar se algo por requisição (cookies, headers) entrar aqui. Abra
          DevTools › Network e recarregue: a resposta de <code>/</code> traz{" "}
          <code>x-nextjs-prerender: 1</code>.
        </p>
        <p>
          O que muda por visitante, como o painel do modo estudo, é componente
          cliente lendo <code>localStorage</code> depois da hidratação. Como as
          três zonas são servidas pela mesma origem, o modo estudo ligado aqui
          continua ligado no catálogo e na conta.
        </p>
      </StudyNote>

      <section className={styles.section} aria-labelledby="arch-heading">
        <h2 id="arch-heading">Como as peças se encaixam</h2>
        <p className={styles.sectionLead}>
          Tudo passa pelo shell em <code>localhost:3000</code>. Ele serve esta
          página e repassa <code>/catalog/*</code> e <code>/account/*</code>{" "}
          para as outras zonas por rewrite.
        </p>
        <div className={styles.diagram}>
          <div className={`${styles.node} ${styles.browser}`}>
            <strong>Navegador</strong>
            <span>localhost:3000</span>
          </div>
          <div className={styles.arrow} aria-hidden="true" />
          <div className={`${styles.node} ${styles.shell}`}>
            <span className={styles.port}>:3000</span>
            <strong>shell</strong>
            <span>
              esta home (estática) · rewrites para as zonas · proxy de{" "}
              <code>/catalog/sale</code>
            </span>
          </div>
          <div className={styles.fork} aria-hidden="true">
            <span />
            <span />
          </div>
          <div className={styles.zones}>
            <div className={`${styles.node} ${styles.catalog}`}>
              <span className={styles.port}>:3001</span>
              <strong>catálogo</strong>
              <span>
                <code>/catalog/[lang]</code> · <code>assetPrefix</code>{" "}
                <code>/catalog-static</code> · produtos, guias, admin
              </span>
            </div>
            <div className={`${styles.node} ${styles.account}`}>
              <span className={styles.port}>:3002</span>
              <strong>conta</strong>
              <span>
                <code>basePath</code> <code>/account</code> · login, carrinho,
                pedidos, perfil, notificações
              </span>
            </div>
            <div className={`${styles.node} ${styles.widgets}`}>
              <span className={styles.port}>:3003</span>
              <strong>widgets</strong>
              <span>
                remote de Module Federation (Rsbuild) · carrinho e recomendados,
                carregados no navegador pelas zonas
              </span>
            </div>
          </div>
          <div className={styles.arrow} aria-hidden="true" />
          <div className={styles.base}>
            <div className={`${styles.node} ${styles.infra}`}>
              <strong>SQLite</strong>
              <span>
                <code>.data/lab.sqlite</code>, compartilhado pelas zonas via{" "}
                <code>@lab/db</code>
              </span>
            </div>
            <div className={`${styles.node} ${styles.infra}`}>
              <strong>Endpoints internos</strong>
              <span>
                <code>/internal/revalidate</code> em cada zona: uma mutação
                avisa as outras para invalidar o cache
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="roteiro"
        className={styles.section}
        aria-labelledby="tour-heading"
      >
        <p className={styles.tourEyebrow}>Roteiro de estudo · 6 passos</p>
        <h2 id="tour-heading">Comece por aqui</h2>
        <p className={styles.sectionLead}>
          Cada passo tem um objetivo, o que fazer e o que observar. Ligue o modo
          estudo antes de começar: o painel mostra a zona, o contador de
          navegações e os widgets de cada página.
        </p>
        <ol className={styles.tour}>
          {STUDY_STEPS.map((step, index) => (
            <li
              key={step.title}
              className={styles.step}
              data-step-zone={step.zone}
              data-testid="study-step"
            >
              <div className={styles.stepHead}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <span className={styles.stepTheme}>{step.theme}</span>
              </div>
              <h3>{step.title}</h3>
              <p className={styles.stepGoal}>{step.goal}</p>
              <dl className={styles.stepBody}>
                <dt>Faça</dt>
                <dd>{step.todo}</dd>
                <dt>Observe</dt>
                <dd>{step.observe}</dd>
              </dl>
              <div className={styles.stepFoot}>
                <a
                  href={step.place.href}
                  className={styles.stepPlace}
                  data-testid="step-place"
                >
                  {step.place.label} →
                </a>
                <span className={styles.stepNotes}>
                  {step.notes.map((slug) => (
                    <a key={slug} href={noteHref(slug)} data-testid="step-note">
                      {noteLabel(slug)}
                    </a>
                  ))}
                </span>
              </div>
            </li>
          ))}
        </ol>
        <p className={styles.tourMore}>
          Quer ir além do roteiro?{" "}
          <a href="/estudo">Todas as notas de estudo →</a>
        </p>
      </section>
    </main>
  );
}
