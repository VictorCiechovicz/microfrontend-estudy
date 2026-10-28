import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (request.method === "POST" && request.headers.has("next-action")) {
    return NextResponse.next();
  }
  const session = request.cookies.get("lab_user")?.value;
  if (session && /^\d+$/.test(session)) return NextResponse.next();
  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/",
    "/((?!(?:login|api|internal)(?:/|$)|_next/|favicon\\.ico$).*)",
  ],
};
