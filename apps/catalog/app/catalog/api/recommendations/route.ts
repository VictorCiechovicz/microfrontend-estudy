import { isLang } from "@lab/db/langs";
import { getRecommendedProducts } from "../../../../lib/data";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const exclude = params.get("exclude");
  if (exclude !== null && !/^\d+$/.test(exclude)) {
    return Response.json({ error: "invalid exclude" }, { status: 400 });
  }
  const lang = params.get("lang") ?? "pt";
  if (!isLang(lang)) {
    return Response.json({ error: "invalid lang" }, { status: 400 });
  }
  const products = await getRecommendedProducts(
    lang,
    exclude === null ? undefined : Number(exclude),
  );
  return Response.json({
    products: products.map(({ id, name, priceCents }) => ({
      id,
      name,
      priceCents,
      href: `/catalog/${lang}/products/${id}`,
    })),
  });
}
