import { TaglineBar } from "@/components/layout/TaglineBar";
import { Footer } from "@/components/layout/Footer";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { AssistantWidget } from "@/features/ai/components/AssistantWidget";
import { getCurrentProfile } from "@/lib/auth";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const profile = await getCurrentProfile();
  return (
    <div className="bg-agri flex min-h-screen flex-col">
      <TaglineBar />
      <PublicNavbar />
      <main className="flex-1 pb-16">{children}</main>
      <Footer />
      <AssistantWidget role={profile?.role ?? null} />
    </div>
  );
}
