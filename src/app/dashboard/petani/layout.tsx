import { AssistantWidget } from "@/features/ai/components/AssistantWidget";
import { TaglineBar } from "@/components/layout/TaglineBar";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { requireRole } from "@/lib/auth";

export default async function PetaniLayout({ children }: LayoutProps<"/dashboard/petani">) {
  await requireRole("petani");
  return (
    <div className="bg-agri flex min-h-screen flex-col">
      <TaglineBar />
      <DashboardNavbar role="petani" />
      <main className="flex flex-1 flex-col pb-24">{children}</main>
      <AssistantWidget role="petani" />
    </div>
  );
}
