// app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const dashAuth = (await cookies()).get("dash_auth")?.value;
  const isLogged = dashAuth === "1";

  return redirect(isLogged ? "/dashboard" : "/login");
}
