// app/dashboard/actions.ts
"use server";

import { revalidateTag } from "next/cache";

export async function refreshDashboard() {
    revalidateTag("dashboard");
}
