import type { Metadata } from "next";
import { parseWalletParams, WalletPage } from "@/features/payments/components/WalletPage";
import { getWallet } from "@/features/payments/queries";
import { requireRole } from "@/lib/auth";
import { displayName } from "@/lib/utils";

export const metadata: Metadata = { title: "Saldo Agriloss" };

export default async function PetaniWalletPage({ searchParams }: PageProps<"/dashboard/petani/saldo">) {
  const profile = await requireRole("petani");
  const [wallet, params] = await Promise.all([getWallet(profile.id), searchParams]);
  const { action, filter } = parseWalletParams(params, "petani");
  return <WalletPage role="petani" wallet={wallet} action={action} filter={filter} accountName={profile.full_name || displayName(profile)} />;
}
