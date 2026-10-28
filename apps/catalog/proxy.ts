import { getProduct } from "@lab/db";
import { isLang } from "@lab/db/langs";
import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const [, , lang, , id] = request.nextUrl.pathname.split("/");
  if (!isLang(lang)) return NextResponse.next();
  if (/^\d+$/.test(id) && getProduct(Number(id), lang)) {
    return NextResponse.next();
  }
  return NextResponse.rewrite(
    new URL(`/catalog/${lang}/_missing`, request.url),
  );
}

export const config = {
  matcher: ["/catalog/:lang/products/:id"],
};
