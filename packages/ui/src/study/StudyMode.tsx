"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, Suspense, useEffect, useRef, useState } from "react";
import { noteHref, noteLabel } from "../notes";
import { ZONES, type Zone } from "../zones";
import { CacheToastHost } from "./CacheToast";
import { notesForPath } from "./pageNotes";
import styles from "./StudyMode.module.css";

const KEY_ON = "lab-study:on";
const KEY_COLLAPSED = "lab-study:collapsed";
const KEY_LAST_DOCUMENT = "lab-study:last-document";

type Arrival =
  | { kind: "crossed"; from: Zone }
  | { kind: "reload" }
  | { kind: "history" }
  | { kind: "hard-same-zone" }
  | { kind: "first" };

type LastDocument = { zone: Zone; docId: string; arrival: Arrival };

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function readLastDocument(): LastDocument | null {
  try {
    const value = JSON.parse(read(KEY_LAST_DOCUMENT) ?? "null");
    return value && typeof value.docId === "string" && value.zone in ZONES
      ? (value as LastDocument)
      : null;
  } catch {
    return null;
  }
}

function classifyArrival(zone: Zone, docId: string): Arrival {
  const previous = readLastDocument();
  if (previous?.docId === docId) return previous.arrival;
  const [entry] = performance.getEntriesByType("navigation") as
    | PerformanceNavigationTiming[]
    | [];
  let arrival: Arrival;
  if (previous && previous.zone !== zone) {
    arrival = { kind: "crossed", from: previous.zone };
  } else if (entry?.type === "reload") {
    arrival = { kind: "reload" };
  } else if (entry?.type === "back_forward") {
    arrival = { kind: "history" };
  } else if (previous) {
    arrival = { kind: "hard-same-zone" };
  } else {
    arrival = { kind: "first" };
  }
  write(KEY_LAST_DOCUMENT, JSON.stringify({ zone, docId, arrival }));
  return arrival;
}

const ROUTE: Record<Zone, ReactNode> = {
  shell: (
    <>
      Servida pelo próprio shell, a porta de entrada em <code>:3000</code>. Sem
      rewrite.
    </>
  ),
  catalog: (
    <>
      O shell (<code>:3000</code>) recebeu a URL e fez <em>rewrite</em> para o
      catálogo (<code>:3001</code>). Os assets saem de{" "}
      <code>/catalog-static</code> (<code>assetPrefix</code>).
    </>
  ),
  account: (
    <>
      O shell (<code>:3000</code>) recebeu a URL e fez <em>rewrite</em> para a
      conta (<code>:3002</code>). O <code>basePath</code> <code>/account</code>{" "}
      prefixa rotas e assets.
    </>
  ),
};

function ArrivalText({ arrival, zone }: { arrival: Arrival; zone: Zone }) {
  switch (arrival.kind) {
    case "crossed":
      return (
        <>
          <strong>Documento novo — você atravessou uma zona.</strong> Saiu de{" "}
          {ZONES[arrival.from].label} para {ZONES[zone].label}: navegação dura,
          e o contador recomeçou do zero.
        </>
      );
    case "reload":
      return (
        <>
          <strong>Documento novo</strong> — a página foi recarregada.
        </>
      );
    case "history":
      return (
        <>
          <strong>Documento novo</strong> — o voltar/avançar do navegador
          carregou o documento de novo.
        </>
      );
    case "hard-same-zone":
      return (
        <>
          <strong>Documento novo</strong> sem trocar de zona: um{" "}
          <code>&lt;a&gt;</code> comum (como os links do header) ou a barra de
          endereço.
        </>
      );
    case "first":
      return (
        <>
          <strong>Primeiro documento</strong> desde que o modo estudo começou a
          contar.
        </>
      );
  }
}

export function StudyMode({ zone }: { zone: Zone }) {
  return (
    <Suspense fallback={null}>
      <StudyModeClient zone={zone} />
    </Suspense>
  );
}

function StudyModeClient({ zone }: { zone: Zone }) {
  const pathname = usePathname();
  const lastPathname = useRef(pathname);
  const [mounted, setMounted] = useState(false);
  const [on, setOn] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [arrival, setArrival] = useState<Arrival>({ kind: "first" });
  const [loadedAt, setLoadedAt] = useState("");
  const [softNavs, setSoftNavs] = useState(0);
  const [path, setPath] = useState("");
  const [widgets, setWidgets] = useState<string[]>([]);

  useEffect(() => {
    setOn(read(KEY_ON) === "1");
    setCollapsed(read(KEY_COLLAPSED) === "1");
    setArrival(classifyArrival(zone, String(performance.timeOrigin)));
    setLoadedAt(
      new Date(performance.timeOrigin).toLocaleTimeString("pt-BR", {
        hour12: false,
      }),
    );
    setPath(window.location.pathname);
    setMounted(true);
  }, [zone]);

  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    setSoftNavs((n) => n + 1);
    setPath(window.location.pathname);
  }, [pathname]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (on) root.dataset.study = "on";
    else delete root.dataset.study;
    write(KEY_ON, on ? "1" : "0");
  }, [on, mounted]);

  useEffect(() => {
    if (!mounted) return;
    write(KEY_COLLAPSED, collapsed ? "1" : "0");
  }, [collapsed, mounted]);

  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === KEY_ON) setOn(event.newValue === "1");
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    function collect() {
      const names = [
        ...new Set(
          [
            ...document.querySelectorAll<HTMLElement>("[data-remote-widget]"),
          ].map((element) => element.dataset.remoteWidget ?? ""),
        ),
      ];
      setWidgets((previous) =>
        previous.join() === names.join() ? previous : names,
      );
    }
    collect();
    const observer = new MutationObserver(collect);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [mounted]);

  if (!mounted) return null;
  const current = ZONES[zone];
  const notes = notesForPath(path);

  return (
    <div className={styles.root} data-study-zone={zone}>
      <CacheToastHost />
      {on && !collapsed ? (
        <aside
          className={styles.panel}
          aria-label="Painel do modo estudo"
          data-testid="study-panel"
        >
          <header className={styles.panelHead}>
            <span className={styles.kicker}>Modo estudo</span>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setCollapsed(true)}
              aria-label="Recolher painel"
              title="Recolher painel (os contornos continuam)"
            >
              –
            </button>
          </header>

          <section className={styles.section}>
            <h2 className={styles.heading}>Quem serviu esta página</h2>
            <p className={styles.zoneLine} data-testid="study-zone">
              <span className={styles.zoneDot} aria-hidden="true" />
              zona {current.label} · :{current.port}
            </p>
            <p className={styles.text}>{ROUTE[zone]}</p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Este documento</h2>
            <div className={styles.counterRow}>
              <span className={styles.counter} data-testid="soft-nav-count">
                {softNavs}
              </span>
              <span className={styles.counterLabel}>
                {softNavs === 1 ? "navegação suave" : "navegações suaves"} desde{" "}
                {loadedAt}
              </span>
            </div>
            <p className={styles.arrival} data-testid="study-arrival">
              <ArrivalText arrival={arrival} zone={zone} />
            </p>
            <p className={styles.text}>
              Um <code>&lt;Link&gt;</code> dentro da zona busca só o payload RSC
              e mantém este documento: o contador sobe. Um link para outra zona
              é um <code>&lt;a&gt;</code> comum e carrega um documento novo.
            </p>
            {softNavs > 0 ? (
              <p className={styles.muted}>
                Última: <code>{path}</code>
              </p>
            ) : null}
          </section>

          <section className={styles.section}>
            <h2 className={styles.heading}>Module Federation nesta página</h2>
            {widgets.length > 0 ? (
              <>
                <ul className={styles.widgets} data-testid="study-widgets">
                  {widgets.map((name) => (
                    <li key={name}>
                      <code>widgets/{name}</code>
                      <span>:3003</span>
                    </li>
                  ))}
                </ul>
                <p className={styles.muted}>
                  Carregados no navegador depois da hidratação; na página, o
                  contorno roxo tracejado marca cada um.
                </p>
              </>
            ) : (
              <p className={styles.muted}>
                {zone === "shell"
                  ? "O shell não carrega widgets."
                  : "Nenhum widget carregado ainda: eles chegam depois da hidratação."}
              </p>
            )}
          </section>

          {notes.length > 0 ? (
            <section className={styles.section}>
              <h2 className={styles.heading}>Notas desta página</h2>
              <ul className={styles.notes}>
                {notes.map((note) => (
                  <li key={noteHref(note)}>
                    <a href={noteHref(note)}>{noteLabel(note)} →</a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <footer className={styles.panelFoot}>
            <a href="/#roteiro">Roteiro de estudo</a>
            <a href="/estudo">Todas as notas</a>
          </footer>
        </aside>
      ) : null}

      <div className={styles.dock}>
        {on && collapsed ? (
          <button
            type="button"
            className={styles.reopen}
            onClick={() => setCollapsed(false)}
          >
            Mostrar painel
          </button>
        ) : null}
        <button
          type="button"
          className={styles.fab}
          aria-pressed={on}
          data-testid="study-toggle"
          onClick={() => {
            setOn(!on);
            setCollapsed(false);
          }}
        >
          <span className={styles.fabIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4.5 4.5" />
            </svg>
          </span>
          Modo estudo
          <span className={styles.fabState} aria-hidden="true">
            {on ? "ligado" : "desligado"}
          </span>
        </button>
      </div>
    </div>
  );
}
