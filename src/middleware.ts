import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    const roles = (token?.roles as string[]) || [];

    // Admin routes — wymaga roli ADMIN
    if (pathname.startsWith("/admin") && !roles.includes("ADMIN")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Player routes — wymaga zalogowania
    if (pathname.startsWith("/player") && !token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/player/:path*"],
};
