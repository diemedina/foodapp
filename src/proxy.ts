import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, isValidToken } from "@/server/auth";

/** Pide el código de acceso antes de cualquier pantalla. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/acceso")) return NextResponse.next();
  if (isValidToken(request.cookies.get(ACCESS_COOKIE)?.value)) return NextResponse.next();
  const url = new URL("/acceso", request.url);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|apple-icon.png|robots.txt).*)"],
};
