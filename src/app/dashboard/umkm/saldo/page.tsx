import type { Metadata } from "next";
import { parseWalletParams, WalletPage } from "@/features/payments/components/WalletPage";
import { getWallet } from "@/features/payments/queries";
import { requireRole } from "@/lib/auth";
import { displayName } from "@/lib/utils";

export const metadata: Metadata = { title: "Saldo Agriloss" };

export default async function UmkmWalletPage({ searchParams }: PageProps<"/dashboard/umkm/saldo">) {
  const profile = await requireRole("umkm");
  const [wallet, params] = await Promise.all([getWallet(profile.id), searchParams]);
  const { action, filter } = parseWalletParams(params, "umkm");
  return <WalletPage role="umkm" wallet={wallet} action={action} filter={filter} accountName={profile.full_name || displayName(profile)} />;
}
