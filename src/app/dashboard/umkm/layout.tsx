import { AssistantWidget } from "@/features/ai/components/AssistantWidget";
import { TaglineBar } from "@/components/layout/TaglineBar";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { requireRole } from "@/lib/auth";

export default async function UmkmLayout({ children }: LayoutProps<"/dashboard/umkm">) {
  await requireRole("umkm");
  return (
    <div className="bg-agri flex min-h-screen flex-col">
      <TaglineBar />
      <DashboardNavbar role="umkm" />
      <main className="flex flex-1 flex-col pb-24">{children}</main>
      <AssistantWidget role="umkm" />
    </div>
  );
}
