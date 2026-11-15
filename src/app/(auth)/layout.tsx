import { TaglineBar } from "@/components/layout/TaglineBar";
import { LinkButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

export default function AuthGroupLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="bg-agri flex min-h-screen flex-col">
      <TaglineBar />
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Logo />
        <LinkButton href="/" size="sm" className="px-8">
          Beranda
        </LinkButton>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
