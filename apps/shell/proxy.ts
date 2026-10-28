import { type NextRequest, NextResponse } from "next/server";
import { CATALOG_URL } from "./lib/zone-urls";

export function proxy(request: NextRequest) {
  const variant =
    request.cookies.get("lab_flag_sale")?.value === "b" ? "sale-b" : "sale-a";
  return NextResponse.rewrite(
    `${CATALOG_URL}/catalog/pt/${variant}${request.nextUrl.search}`,
  );
}

export const config = {
  matcher: ["/catalog/sale"],
};
