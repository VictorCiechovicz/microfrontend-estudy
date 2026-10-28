import { getRelatedProducts } from "../../../../lib/data";

export async function GET(request: Request) {
  const exclude = new URL(request.url).searchParams.get("exclude");
  if (exclude !== null && !/^\d+$/.test(exclude)) {
    return Response.json({ error: "invalid exclude" }, { status: 400 });
  }
  const products = await getRelatedProducts(
    exclude === null ? undefined : Number(exclude),
  );
  return Response.json({
    products: products.map(({ id, name, priceCents }) => ({
      id,
      name,
      priceCents,
      href: `/catalog/pt/products/${id}`,
    })),
  });
}
