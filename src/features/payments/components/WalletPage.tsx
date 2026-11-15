import Link from "next/link";
import { Container, PageTitle } from "@/components/ui/Container";
import { Icon, type IconName } from "@/components/ui/Icon";
import { TopUpForm, WithdrawForm } from "@/features/payments/components/WalletForms";
import type { WalletOverview } from "@/features/payments/queries";
import { WALLET_TX_LABEL } from "@/lib/constants";
import { cn, formatDate, formatRupiah } from "@/lib/utils";
import type { UserRole, WalletTransactionType } from "@/types/database";

const TX_ICON: Record<WalletTransactionType, IconName> = {
  pemasukan: "arrow-down",
  isi_saldo: "plus",
  pembayaran: "arrow-up",
  penarikan: "arrow-up",
};

type Action = "isi" | "tarik" | null;
type Filter = "semua" | "masuk" | "keluar";

/** Halaman Saldo Agriloss: kartu saldo, isi/tarik saldo, dan riwayat mutasi. */
export function WalletPage({
  role,
  wallet,
  action,
  filter,
  accountName,
}: {
  role: UserRole;
  wallet: WalletOverview;
  action: Action;
  filter: Filter;
  accountName: string;
}) {
  const base = `/dashboard/${role}/saldo`;
  const canTopUp = role === "umkm";
  const href = (next: { aksi?: Action; filter?: Filter }) => {
    const params = new URLSearchParams();
    const aksi = next.aksi === undefined ? action : next.aksi;
    const f = next.filter ?? filter;
    if (aksi) params.set("aksi", aksi);
    if (f !== "semua") params.set("filter", f);
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  };
  const rows = wallet.transactions.filter((tx) => (filter === "masuk" ? tx.amount > 0 : filter === "keluar" ? tx.amount < 0 : true));

  return (
    <Container className="pt-6 sm:pt-10">
      <PageTitle
        title="Saldo Agriloss"
        description={
          role === "petani"
            ? "Hasil penjualan masuk otomatis setelah UMKM membayar. Tarik kapan saja ke rekening bank atau e-wallet."
            : "Isi saldo untuk membayar bahan baku lebih cepat, tanpa perlu memindai QR setiap transaksi."
        }
      />

      <section className="relative overflow-hidden rounded-4xl bg-linear-to-br from-leaf-700 via-leaf-800 to-leaf-900 p-6 text-white shadow-card sm:p-8">
        <span aria-hidden="true" className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-lime/15" />
        <span aria-hidden="true" className="absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-sun/15" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-leaf-100">
              <Icon name="wallet" /> Saldo tersedia
            </p>
            <p className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{formatRupiah(wallet.balance)}</p>
            <p className="mt-2 text-xs text-leaf-100">
              Masuk {formatRupiah(wallet.totalIn)} · Keluar {formatRupiah(wallet.totalOut)}
            </p>
          </div>
          <div className="flex gap-3">
            {canTopUp && (
              <Link
                href={href({ aksi: action === "isi" ? null : "isi" })}
                scroll={false}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3 text-xs font-bold transition",
                  action === "isi" ? "bg-lime text-ink" : "bg-white/10 hover:bg-white/20",
                )}
              >
                <Icon name="plus" size={22} /> Isi Saldo
              </Link>
            )}
            <Link
              href={href({ aksi: action === "tarik" ? null : "tarik" })}
              scroll={false}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-2xl px-4 py-3 text-xs font-bold transition",
                action === "tarik" ? "bg-lime text-ink" : "bg-white/10 hover:bg-white/20",
              )}
            >
              <Icon name="arrow-up" size={22} /> Tarik Saldo
            </Link>
          </div>
        </div>
      </section>

      {action && (
        <section className="mt-6 rounded-4xl bg-white/85 p-6 shadow-card sm:p-8" aria-labelledby="wallet-action">
          <h2 id="wallet-action" className="mb-5 text-2xl font-bold">
            {action === "isi" ? "Isi Saldo" : "Tarik Saldo"}
          </h2>
          {action === "isi" && canTopUp ? <TopUpForm /> : <WithdrawForm balance={wallet.balance} defaultName={accountName} />}
          <p className="mt-5 text-xs text-neutral-600">
            Mode simulasi: tidak ada uang sungguhan yang berpindah.
          </p>
        </section>
      )}

      <section className="mt-10" aria-labelledby="riwayat-saldo">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="riwayat-saldo" className="text-2xl font-bold">
            Riwayat Saldo
          </h2>
          <nav aria-label="Filter riwayat" className="flex gap-2">
            {(["semua", "masuk", "keluar"] as Filter[]).map((option) => (
              <Link
                key={option}
                href={href({ filter: option })}
                scroll={false}
                aria-current={filter === option ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition",
                  filter === option ? "bg-leaf-700 text-white" : "bg-white/70 hover:bg-white",
                )}
              >
                {option}
              </Link>
            ))}
          </nav>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-3xl bg-white/70 px-6 py-10 text-center text-sm text-neutral-600">
            Belum ada {filter === "semua" ? "mutasi" : filter === "masuk" ? "uang masuk" : "uang keluar"}.
          </p>
        ) : (
          <ul className="divide-y divide-leaf-100 overflow-hidden rounded-3xl bg-white/85 shadow-card">
            {rows.map((tx) => {
              const incoming = tx.amount > 0;
              return (
                <li key={tx.id} className="flex items-center gap-4 px-4 py-4 sm:px-6">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      incoming ? "bg-leaf-100 text-leaf-700" : "bg-sun-soft text-[#b4600a]",
                    )}
                  >
                    <Icon name={TX_ICON[tx.type]} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{tx.description}</p>
                    <p className="text-xs text-neutral-600">
                      {WALLET_TX_LABEL[tx.type]} · {formatDate(tx.created_at, true)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-bold tabular-nums", incoming ? "text-leaf-700" : "text-ink")}>
                      {incoming ? "+" : "−"}
                      {formatRupiah(Math.abs(tx.amount))}
                    </p>
                    <p className="text-xs text-neutral-500 tabular-nums">Saldo {formatRupiah(tx.balance_after)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Container>
  );
}

export function parseWalletParams(params: Record<string, string | string[] | undefined>, role: UserRole) {
  const aksi = params.aksi === "isi" && role === "umkm" ? "isi" : params.aksi === "tarik" ? "tarik" : null;
  const filter = params.filter === "masuk" || params.filter === "keluar" ? params.filter : "semua";
  return { action: aksi as Action, filter: filter as Filter };
}
