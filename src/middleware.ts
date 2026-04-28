import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/tailor")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (token.role !== "TAILOR") {
      return NextResponse.redirect(new URL("/customer/dashboard", request.url));
    }
  }

  if (pathname.startsWith("/customer")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (token.role !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/tailor/dashboard", request.url));
    }
  }

  if (pathname.startsWith("/customize")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tailor/:path*", "/customer/:path*", "/customize/:path*"],
};
