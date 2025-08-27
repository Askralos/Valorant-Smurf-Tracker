// app/api/login/route.ts — check du MDP et cookie httpOnly
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { password } = await req.json();
    const ok = password && process.env.DASHBOARD_PASSWORD && password === process.env.DASHBOARD_PASSWORD;
    if (!ok) return NextResponse.json({ ok: false }, { status: 401 });

    const res = NextResponse.json({ ok: true });
    res.cookies.set("dash_auth", "1", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 30,
    });
    return res;
}
