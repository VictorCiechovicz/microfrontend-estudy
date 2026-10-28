import { type NextRequest, NextResponse } from "next/server";
import { getNote } from "./lib/notes";
import { CATALOG_URL } from "./lib/zone-urls";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/estudo/")) {
    return getNote(pathname.slice("/estudo/".length))
      ? NextResponse.next()
      : NextResponse.rewrite(new URL("/_missing", request.url));
  }
  if (
    pathname === "/account/internal" ||
    pathname.startsWith("/account/internal/")
  ) {
    return new NextResponse(null, { status: 404 });
  }
  if (pathname !== "/catalog/sale") return NextResponse.next();
  const variant =
    request.cookies.get("lab_flag_sale")?.value === "b" ? "sale-b" : "sale-a";
  return NextResponse.rewrite(
    `${CATALOG_URL}/catalog/pt/${variant}${request.nextUrl.search}`,
  );
}

export const config = {
  matcher: ["/catalog/sale", "/account/internal/:path*", "/estudo/:slug"],
};
