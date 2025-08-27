import { buildDashboard } from "@/lib/aggregate";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const data = await buildDashboard();
  return <DashboardClient data={data} />;
}
