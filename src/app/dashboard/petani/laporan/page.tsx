import type { Metadata } from "next";
import { FinanceReportView } from "@/features/reports/components/FinanceReportView";
import { getFinanceReport } from "@/features/reports/queries";
import { requireRole } from "@/lib/auth";
import { displayName } from "@/lib/utils";

export const metadata: Metadata = { title: "Laporan Keuangan" };

export default async function PetaniReportPage() {
  const profile = await requireRole("petani");
  const report = await getFinanceReport(profile.id, "petani");
  return <FinanceReportView report={report} role="petani" ownerName={displayName(profile)} />;
}
