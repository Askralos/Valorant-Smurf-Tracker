import schedule from "./rateLimiter";
// lib/henrik.ts — appels API + helpers
const BASE = "https://api.henrikdev.xyz";
const KEY = process.env.HENRIK_API_KEY!;

export type Region = "eu" | "na" | "latam" | "br" | "ap" | "kr";
export type AccountInput = { region: Region; name: string; tag: string };


async function hFetch<T>(path: string, search?: Record<string, string | number>) {
    return schedule(async () => {
        const url = new URL(path, BASE);
        if (search) Object.entries(search).forEach(([k, v]) => url.searchParams.set(k, String(v)));
        const r = await fetch(url, {
            headers: { Authorization: KEY },
            cache: "no-store",
            next: { revalidate: 0 },
        });

        if (!r.ok) throw new Error(`${r.status} ${r.statusText} for ${url}`);
        return (await r.json()) as T;
    });
}


// — Endpoints
export const getAccount = (a: AccountInput) =>
    hFetch<{ data: { account_level: number; puuid: string; region: string } }>(
        `/valorant/v2/account/${a.name}/${a.tag}`
    );

export const getMMR = (a: AccountInput) =>
    hFetch<{ data: any }>(`/valorant/v3/mmr/${a.region}/pc/${a.name}/${a.tag}`);

export const getMmrHistory = (a: AccountInput) =>
    hFetch<{ data: { account: any; history: { date: string }[] } }>(
        `/valorant/v2/mmr-history/${a.region}/pc/${a.name}/${a.tag}`
    );

type StoredMatch = {
    meta: { id: string; season: { short: string } };
    stats: {
        team: "red" | "blue";
        kills: number;
        deaths: number;
        assists: number;
        shots: { head: number; body: number; leg: number };
        damage: { dealt: number; received: number };
    };
    teams: { red: number; blue: number }; // rounds gagnés
};

export async function getStoredMatchesPaged(a: AccountInput, page: number, size: number) {
    return hFetch<{ results: { total: number; returned: number }; data: StoredMatch[] }>(
        `/valorant/v1/stored-matches/${a.region}/${a.name}/${a.tag}`,
        { mode: "competitive", page, size }
    );
}

export const getMatchById = (id: string, region: Region) =>
    hFetch<{ data: { metadata: { game_length: number } } }>(`/valorant/v4/match/${region}/${id}`);
