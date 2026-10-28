import { Price } from "@lab/ui";
import { useEffect, useId, useState } from "react";
import { createMount } from "./mount";

type RecommendationsBody = {
  products: { id: number; name: string; priceCents: number; href: string }[];
};

type Lang = "pt" | "en";

export type RecommendationsProps = { excludeId?: number; lang?: Lang };

const HEADINGS: Record<Lang, string> = {
  pt: "Recomendados",
  en: "Recommended",
};

export default function Recommendations({
  excludeId,
  lang = "pt",
}: RecommendationsProps) {
  const headingId = useId();
  const [body, setBody] = useState<RecommendationsBody | null>(null);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ lang });
    if (excludeId !== undefined) query.set("exclude", String(excludeId));
    fetch(`/catalog/api/recommendations?${query}`, {
      credentials: "same-origin",
    })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)
      .then((next: RecommendationsBody | null) => {
        if (active) setBody(next);
      });
    return () => {
      active = false;
    };
  }, [excludeId, lang]);

  if (body === null) return null;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>{HEADINGS[lang]}</h2>
      <ul>
        {body.products.map((product) => (
          <li key={product.id}>
            <a href={product.href}>{product.name}</a>{" "}
            <Price cents={product.priceCents} lang={lang} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export const mount = createMount(Recommendations);
