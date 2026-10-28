"use client";

import type { CacheReport, LocalInvalidation } from "@lab/cache-sync";
import { useEffect, useEffectEvent, useState } from "react";
import { ZONES } from "../zones";
import styles from "./CacheToast.module.css";

const AUTO_DISMISS_MS = 30_000;
const CACHE_REPORT_EVENT = "lab:cache-report";

export function announceCacheReport(report: CacheReport) {
  window.dispatchEvent(
    new CustomEvent<CacheReport>(CACHE_REPORT_EVENT, { detail: report }),
  );
}

export function CacheToastHost() {
  const [current, setCurrent] = useState<{
    id: number;
    report: CacheReport;
  } | null>(null);

  useEffect(() => {
    function onReport(event: Event) {
      const { detail } = event as CustomEvent<CacheReport>;
      setCurrent((previous) => ({
        id: (previous?.id ?? 0) + 1,
        report: detail,
      }));
    }
    window.addEventListener(CACHE_REPORT_EVENT, onReport);
    return () => window.removeEventListener(CACHE_REPORT_EVENT, onReport);
  }, []);

  if (!current) return null;
  return (
    <CacheToast
      key={current.id}
      report={current.report}
      onDismiss={() => setCurrent(null)}
    />
  );
}

function describe(item: LocalInvalidation): string {
  switch (item.kind) {
    case "updateTag":
      return `updateTag(${item.tag})`;
    case "revalidateTag":
      return `revalidateTag(${item.tag}, ${item.profile})`;
    case "refresh":
      return "refresh()";
  }
}

function CacheToast({
  report,
  onDismiss,
}: {
  report: CacheReport;
  onDismiss: () => void;
}) {
  const dismiss = useEffectEvent(onDismiss);
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section
      className={styles.toast}
      role="status"
      aria-label="Eventos de cache"
      data-testid="cache-toast"
      data-from-zone={report.zone}
    >
      <header className={styles.head}>
        <span className={styles.kicker}>Eventos de cache</span>
        <span className={styles.origin} data-zone-pill={report.zone}>
          {ZONES[report.zone].label} :{ZONES[report.zone].port}
        </span>
        <button
          type="button"
          className={styles.close}
          onClick={onDismiss}
          aria-label="Fechar aviso de cache"
        >
          ×
        </button>
      </header>
      <div className={styles.block}>
        <p className={styles.label}>Feito nesta zona</p>
        <ul className={styles.calls} data-testid="cache-toast-local">
          {report.local.map((item) => (
            <li key={describe(item)}>
              <code>{describe(item)}</code>
            </li>
          ))}
        </ul>
        {report.local.every((item) => item.kind === "refresh") ? (
          <p className={styles.hint}>
            Nenhum cache tocado: só re-renderiza a página.
          </p>
        ) : null}
      </div>
      <div className={styles.block}>
        <p className={styles.label}>
          Avisado por broadcast{" "}
          <span className={styles.tags}>
            {report.broadcast.tags.map((tag) => (
              <code key={tag}>{tag}</code>
            ))}
          </span>
        </p>
        <ul className={styles.zones} data-testid="cache-toast-zones">
          {report.broadcast.results.map((result) => (
            <li
              key={result.zone}
              data-zone-pill={result.zone}
              data-ok={result.ok ? "true" : "false"}
              title={result.error}
            >
              {ZONES[result.zone].label} {result.ok ? "✓" : "✗"}
              {result.ok ? null : (
                <span className={styles.error}>{result.error}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <a className={styles.more} href="/estudo/cross-zone-cache">
        Por que cada zona é avisada? →
      </a>
    </section>
  );
}
