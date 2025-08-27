"use client";

import { useState } from "react";
import { buildDashboard } from "@/lib/aggregate";
import { refreshDashboard } from "./action";
import rankIcons from "@/lib/rank.json";

function getRankIcon(tierId?: number) {
    const key = String(tierId ?? "0");
    const icons = rankIcons as Record<string, string>;
    return icons[key] ?? icons["0"]; // fallback unranked
}

function StatBox({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg bg-white/70 p-3 text-center shadow-sm">
            <div className="text-xs text-zinc-500">{label}</div>
            <div className="mt-1 text-xl font-semibold">{value}</div>
        </div>
    );
}

export default function DashboardClient({ data }: { data: Awaited<ReturnType<typeof buildDashboard>> }) {
    const [selected, setSelected] = useState(data.accounts[0]);

    return (
        <main className="min-h-screen p-8 bg-gradient-to-br from-pink-50 via-violet-50 to-sky-50">
            <section className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* === HEADER GLOBAL === */}
                <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-md flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* L’icône pourrait être un rank global moyen ou juste un logo */}
                        <img
                            src={getRankIcon(data.global.peakRankId)}
                            alt={data.global.peakRank}
                            className="h-16 w-16"
                        />

                        <div>
                            <div className="text-sm text-zinc-500">Peak Rating</div>
                            <div className="text-2xl font-bold">{data.global.peakRank}</div>
                        </div>

                    </div>
                    <div className="flex gap-8">
                        <div className="text-center">
                            <div className="text-sm text-zinc-500">K/D moyen</div>
                            <div className="text-2xl font-bold">{data.global.kd}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-zinc-500">Heures totales</div>
                            <div className="text-2xl font-bold">{data.global.hoursTracked}h</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-zinc-500">Matchs cumulés</div>
                            <div className="text-2xl font-bold">{data.global.matches}</div>
                        </div>
                    </div>
                </div>

                {/* === STATISTIQUES GLOBALES === */}
                <div className="rounded-2xl bg-white p-6 shadow-md">
                    <h2 className="text-lg font-semibold mb-4">Statistiques globales</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <StatBox label="K/D Ratio" value={data.global.kd} />
                        <StatBox label="HS%" value={`${data.global.hs}%`} />
                        <StatBox label="Dmg/Round" value={data.global.dmgPerRound} />
                        <StatBox label="Win %" value={`${data.global.winrate}%`} />
                    </div>
                </div>

                {/* === COMPTES === */}
                <div className="lg:col-span-2">
                    <h2 className="text-lg font-semibold mb-3">Mes comptes</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {data.accounts.map((a) => (
                            <button
                                key={`${a.account.name}#${a.account.tag}`}
                                onClick={() => setSelected(a)}
                                className={`rounded-2xl p-6 text-white shadow-md transition ${selected.account.name === a.account.name
                                    ? "ring-4 ring-violet-400"
                                    : ""
                                    }`}
                                style={{
                                    background:
                                        "linear-gradient(to bottom right, #d946ef, #8b5cf6)",
                                }}
                            >
                                <div className="text-xl font-bold">{a.account.name}</div>
                                <div className="text-sm opacity-80">{a.account.region.toUpperCase()}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* === PREVIEW === */}
                <div className="rounded-2xl bg-white p-6 shadow-md">
                    <h2 className="text-lg font-semibold mb-4">Preview</h2>
                    <div className="flex items-center justify-center gap-4">
                        <img
                            src={getRankIcon(selected.previousActRankId)}
                            alt="Prev rank"
                            className="h-12 w-12"
                        />
                        <span className="text-2xl">➡️</span>
                        <img
                            src={getRankIcon(selected.peakRankId)}
                            alt="Current rank"
                            className="h-12 w-12"
                        />
                    </div>
                    <div className="mt-6 text-center font-semibold">
                        {selected.account.name} • lvl {selected.account.level}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-3 text-center">
                        <StatBox label="K/D" value={selected.kd} />
                        <StatBox label="HS%" value={`${selected.hs}%`} />
                        <StatBox label="Dmg/R" value={selected.dmgPerRound} />
                        <StatBox label="Win %" value={`${selected.winrate}%`} />
                    </div>
                    <div className="mt-4 text-sm text-zinc-500 text-center">
                        Date de la dernière game :{" "}
                        {selected.lastRankedAt
                            ? new Date(selected.lastRankedAt).toLocaleDateString("fr-FR", {
                                weekday: "long",
                                day: "2-digit",
                                month: "long",
                            })
                            : "—"}
                    </div>
                </div>
            </section>
        </main>
    );
}
