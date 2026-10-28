import styles from "./page.module.css";

export const ensureStatic = "navigation";

const START_STEPS = [
  {
    zone: "catalog",
    title: "Navegue pelo catálogo",
    text: "A lista e as páginas de produto vêm da zona catálogo (:3001). Entre zonas a navegação é dura; dentro do catálogo, suave.",
    href: "/catalog/pt",
    cta: "Ver os produtos",
  },
  {
    zone: "widgets",
    title: "Abra um produto",
    text: "O carrinho no topo e os recomendados no fim da página são widgets de outro app, carregados no navegador via Module Federation.",
    href: "/catalog/pt/products/5",
    cta: "Abrir o Produto 5",
  },
  {
    zone: "account",
    title: "Entre como Ana",
    text: "A zona conta (:3002) guarda carrinho, pedidos e notificações. Um pedido feito aqui atualiza o estoque no catálogo.",
    href: "/account/login",
    cta: "Ir para o login",
  },
] as const;

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
        </div>
      </section>

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
        aria-labelledby="start-heading"
      >
        <h2 id="start-heading">Comece por aqui</h2>
        <ol className={styles.steps}>
          {START_STEPS.map((step, index) => (
            <li
              key={step.href}
              className={styles.step}
              data-step-zone={step.zone}
            >
              <span className={styles.stepNumber}>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <a href={step.href}>{step.cta} →</a>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
