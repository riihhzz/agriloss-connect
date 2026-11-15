import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { DASHBOARD_HOME } from "@/lib/constants";

/** /dashboard → arahkan ke beranda sesuai peran. */
export default async function DashboardIndex() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/masuk");
  redirect(DASHBOARD_HOME[profile.role]);
}
