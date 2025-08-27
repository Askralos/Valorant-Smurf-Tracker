// lib/aggregate.ts — agrégation et calculs pondérés
import type { AccountInput, Region } from "./henrik";
import { unstable_cache } from "next/cache";
import { getAccount, getMMR, getMmrHistory, getStoredMatchesPaged, getMatchById } from "./henrik";
import rawAccount from './account.json'

export type AccountStats = {
    account: AccountInput & { level: number };
    peakRank: string;
    peakRankId?: number;
    previousActRank?: string;
    previousActRankId?: number; // << ajout
    matches: number;
    kd: number;
    hs: number;
    dmgPerRound: number;
    winrate: number;
    lastRankedAt?: string;
    hoursTracked: number;
    rawTotals: {
        kills: number; deaths: number; assists: number;
        head: number; body: number; leg: number;
        dmg: number; rounds: number; wins: number; matches: number; ms: number;
    };
};


const parseSeasonShort = (s: string) => {
    const m = /^e(\d+)a(\d+)$/i.exec(s);
    return m ? [Number(m[1]), Number(m[2])] : [0, 0];
};

export async function buildAccountStats(a: AccountInput): Promise<AccountStats> {
    const [acc, mmr, mmrH] = await Promise.all([getAccount(a), getMMR(a), getMmrHistory(a)]);
    const level = acc.data.account_level;

    // previous act rank
    let previousActRank: string | undefined;
    let previousActRankId: string | undefined;
    if (Array.isArray(mmr.data?.seasonal)) {
        const sorted = [...mmr.data.seasonal].sort((x: any, y: any) => {
            const [ex, ax] = parseSeasonShort(x.season.short);
            const [ey, ay] = parseSeasonShort(y.season.short);
            return ex - ey || ax - ay;
        });
        if (sorted.length >= 2) {
            const prev = sorted[sorted.length - 2];
            previousActRank = prev?.end_tier?.name;
            previousActRankId = prev?.end_tier?.id; // << ajout
        }
    }

    const SIZE = Number(process.env.STORED_PAGE_SIZE ?? 100);
    const MAX_PAGES = Number(process.env.MAX_STORED_PAGES ?? 3);
    let totals = {
        kills: 0, deaths: 0, assists: 0,
        head: 0, body: 0, leg: 0,
        dmg: 0, rounds: 0, wins: 0, matches: 0, ms: 0,
    };

    for (let p = 1; p <= MAX_PAGES; p++) {
        const page = await getStoredMatchesPaged(a, p, SIZE);
        for (const m of page.data) {
            totals.kills += Number(m.stats?.kills ?? 0);
            totals.deaths += Number(m.stats?.deaths ?? 0);
            totals.assists += Number(m.stats?.assists ?? 0);
            totals.head += Number(m.stats?.shots?.head ?? 0);
            totals.body += Number(m.stats?.shots?.body ?? 0);
            totals.leg += Number(m.stats?.shots?.leg ?? 0);
            totals.dmg += Number(m.stats?.damage?.dealt ?? 0);
            const rounds = Number(m.teams?.red ?? 0) + Number(m.teams?.blue ?? 0);
            totals.rounds += rounds;
            const hasTeam = m.stats?.team === "red" || m.stats?.team === "blue";
            const red = Number(m.teams?.red ?? 0);
            const blue = Number(m.teams?.blue ?? 0);
            const win = hasTeam ? (m.stats?.team === "red" ? red > blue : blue > red) : false;
            totals.wins += win ? 1 : 0;
            totals.matches += 1;
        }
        if (page.results.returned < SIZE) break;
    }

    // 💡 Approximation des heures à partir des rounds
    const AVG_ROUND_DURATION_MS = 100 * 1000;
    totals.ms = totals.rounds * AVG_ROUND_DURATION_MS;

    const shots = totals.head + totals.body + totals.leg || 1;
    const roundsSafe = totals.rounds || 1;
    const kd = totals.kills / (totals.deaths || 1);
    const hs = (totals.head / shots) * 100;
    const dmgPerRound = totals.dmg / roundsSafe;
    const winrate = (totals.wins / (totals.matches || 1)) * 100;
    const lastRankedAt = mmrH.data?.history?.[0]?.date;

    return {
        account: { ...a, level },
        peakRank: mmr.data?.peak?.tier?.name ?? mmr.data?.highest_rank?.patched_tier ?? "Unranked",
        peakRankId: mmr.data?.peak?.tier?.id,
        previousActRankId,
        previousActRank,
        matches: totals.matches,
        kd: Number(kd.toFixed(2)),
        hs: Number(hs.toFixed(1)),
        dmgPerRound: Number(dmgPerRound.toFixed(1)),
        winrate: Number(winrate.toFixed(1)),
        lastRankedAt,
        hoursTracked: Number((totals.ms / 1000 / 3600).toFixed(1)), // en heures
        rawTotals: totals,
    };
}


export async function buildDashboard() {
    const accounts: AccountInput[] = (rawAccount as any[])
        .filter((a) => !a.disabled)
        .map((a) => ({
            ...a,
            region: a.region as Region,
        }));

    const perAccount = await Promise.all(accounts.map(buildAccountStats));
    // trouver le compte avec le rang le plus haut
    let highestRankId = 0;
    let highestRankName = "Unranked";

    for (const acc of perAccount) {
        if ((acc.peakRankId ?? 0) > highestRankId) {
            highestRankId = acc.peakRankId ?? 0;
            highestRankName = acc.peakRank;
        }
    }


    // Agrégats globaux (pondérés)
    const total = perAccount.reduce(
        (s, a) => ({
            kills: s.kills + a.rawTotals.kills,
            deaths: s.deaths + a.rawTotals.deaths,
            head: s.head + a.rawTotals.head,
            body: s.body + a.rawTotals.body,
            leg: s.leg + a.rawTotals.leg,
            dmg: s.dmg + a.rawTotals.dmg,
            rounds: s.rounds + a.rawTotals.rounds,
            wins: s.wins + a.rawTotals.wins,
            matches: s.matches + a.rawTotals.matches,
            hours: s.hours + a.hoursTracked,
        }),
        { kills: 0, deaths: 0, head: 0, body: 0, leg: 0, dmg: 0, rounds: 0, wins: 0, matches: 0, hours: 0 }
    );

    const global = {
        kd: Number((total.kills / (total.deaths || 1)).toFixed(2)),
        hs: Number(((total.head / ((total.head + total.body + total.leg) || 1)) * 100).toFixed(1)),
        dmgPerRound: Number((total.dmg / (total.rounds || 1)).toFixed(1)),
        winrate: Number(((total.wins / (total.matches || 1)) * 100).toFixed(1)),
        hoursTracked: Number(total.hours.toFixed(1)),
        matches: total.matches,
        peakRank: highestRankName,      // << ajout
        peakRankId: highestRankId
    };

    return { accounts: perAccount, global };
}

// Cache the dashboard computation to limit API calls.
// Revalidate periodically and allow manual tag-based revalidation.
export const getDashboard = unstable_cache(
    buildDashboard,
    ["dashboard-cache-key"],
    { revalidate: Number(process.env.DASHBOARD_REVALIDATE_SECONDS ?? 300), tags: ["dashboard"] }
);
