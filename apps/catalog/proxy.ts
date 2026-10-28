import { getProduct } from "@lab/db";
import { isLang, type Lang } from "@lab/db/langs";
import { type NextRequest, NextResponse } from "next/server";
import { getGuide } from "./lib/guides";

function exists(lang: Lang, section: string, key: string): boolean {
  if (section === "products") {
    return /^\d+$/.test(key) && getProduct(Number(key), lang) !== null;
  }
  return getGuide(key) !== undefined;
}

export function proxy(request: NextRequest) {
  const [, , lang, section, key] = request.nextUrl.pathname.split("/");
  if (!isLang(lang)) return NextResponse.next();
  if (exists(lang, section, key)) return NextResponse.next();
  return NextResponse.rewrite(
    new URL(`/catalog/${lang}/_missing`, request.url),
  );
}

export const config = {
  matcher: ["/catalog/:lang/products/:id", "/catalog/:lang/guides/:slug"],
};
