import { revalidateTag } from "next/cache";

export async function POST() {
    try {
        revalidateTag("dashboard");
        return new Response(JSON.stringify({ revalidated: true }), { status: 200, headers: { "content-type": "application/json" } });
    } catch (e) {
        return new Response(JSON.stringify({ revalidated: false }), { status: 500, headers: { "content-type": "application/json" } });
    }
}


