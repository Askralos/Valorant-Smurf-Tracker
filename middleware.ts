// middleware.ts — protège /dashboard
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
    const isLogged = req.cookies.get("dash_auth")?.value === "1";
    const url = req.nextUrl;

    if (url.pathname.startsWith("/dashboard") && !isLogged) {
        return NextResponse.redirect(new URL("/login", req.url));
    }
    if (url.pathname === "/login" && isLogged) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
}
export const config = { matcher: ["/dashboard/:path*", "/login"] };
