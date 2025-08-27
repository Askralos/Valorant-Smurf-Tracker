// app/login/page.tsx — simple form (shadcn/button + input)
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [pwd, setPwd] = useState("");
    const [err, setErr] = useState("");
    const router = useRouter();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr("");
        const r = await fetch("/api/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ password: pwd }),
        });
        if (r.ok) router.push("/dashboard");
        else setErr("Mot de passe incorrect.");
    };

    return (
        <main className="min-h-screen grid place-items-center bg-gradient-to-b from-zinc-50 to-zinc-100">
            <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 rounded-xl border bg-white/70 p-6 shadow">
                <h1 className="text-xl font-semibold">Connexion</h1>
                <input
                    type="password"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    placeholder="Mot de passe"
                    className="w-full rounded-md border px-3 py-2 outline-none focus:ring"
                />
                {err && <p className="text-sm text-red-600">{err}</p>}
                <button className="w-full rounded-md px-3 py-2 bg-black text-white">Entrer</button>
            </form>
        </main>
    );
}
