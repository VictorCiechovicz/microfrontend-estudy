import { getProduct } from "@lab/db";
import { isLang } from "@lab/db/langs";
import { notFound } from "next/navigation";
import { ImageResponse } from "next/og";

export const alt = "Product";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FORMATS = {
  pt: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
  en: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
};

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isLang(lang) || !/^\d+$/.test(id)) notFound();
  const product = getProduct(Number(id), lang);
  if (!product) notFound();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
        fontSize: 72,
      }}
    >
      <div>{product.name}</div>
      <div style={{ fontSize: 56, color: "#555" }}>
        {FORMATS[lang].format(product.priceCents / 100)}
      </div>
    </div>,
    size,
  );
}
