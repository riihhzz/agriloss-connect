import type { Metadata } from "next";
import { FinanceReportView } from "@/features/reports/components/FinanceReportView";
import { getFinanceReport } from "@/features/reports/queries";
import { requireRole } from "@/lib/auth";
import { displayName } from "@/lib/utils";

export const metadata: Metadata = { title: "Laporan Keuangan" };

export default async function UmkmReportPage() {
  const profile = await requireRole("umkm");
  const report = await getFinanceReport(profile.id, "umkm");
  return <FinanceReportView report={report} role="umkm" ownerName={displayName(profile)} />;
}
