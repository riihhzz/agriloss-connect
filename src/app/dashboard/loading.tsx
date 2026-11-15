import { Mascot } from "@/components/ui/Mascot";

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24" role="status" aria-live="polite">
      <Mascot pose="think" width={120} className="animate-bounce" />
      <p className="text-sm font-medium text-leaf-800">Memuat data...</p>
    </div>
  );
}
