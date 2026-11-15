import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { buttonClass, LinkButton } from "@/components/ui/Button";
import { Container, PageTitle } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Mascot } from "@/components/ui/Mascot";
import { cancelPayment } from "@/features/payments/actions";
import {
  CopyButton,
  PaymentLive,
} from "@/features/payments/components/PaymentLive";
import { getPayment } from "@/features/payments/queries";
import { isPaymentExpired, secondsUntil } from "@/features/payments/status";
import { requireRole } from "@/lib/auth";
import { BANK_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/constants";
import { siteOrigin } from "@/lib/site";
import { formatDate, formatKg, formatRupiah } from "@/lib/utils";

export const metadata: Metadata = { title: "Pembayaran" };

export default async function PaymentPage({
  params,
}: PageProps<"/dashboard/umkm/pembayaran/[id]">) {
  const profile = await requireRole("umkm");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const payment = await getPayment(id);
  if (!payment || payment.payer_id !== profile.id) notFound();

  const isTopup = payment.kind === "isi_saldo";
  const title = isTopup
    ? "Isi Saldo Agriloss"
    : `Pembelian ${payment.offer?.fruit_type ?? "bahan baku"}${payment.offer ? ` ${formatKg(payment.offer.quantity_kg)}` : ""}`;
  const expired = isPaymentExpired(payment);
  const simulatorUrl = `${await siteOrigin()}/simulasi-bayar/${payment.id}`;
  const backHref = isTopup
    ? "/dashboard/umkm/saldo"
    : payment.offer_id
      ? `/dashboard/umkm/penawaran/${payment.offer_id}`
      : "/dashboard/umkm";

  // ───────── Berhasil ─────────
  if (payment.status === "berhasil") {
    return (
      <Container className="pt-6 sm:pt-10">
        <section className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-4xl bg-white/80 p-8 text-center shadow-card">
          <Mascot pose="wave" width={150} animated />
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-leaf-700 text-white">
            <Icon name="check" size={30} className="stroke-3" />
          </span>
          <h1 className="text-3xl font-bold">Pembayaran Berhasil</h1>
          <p className="text-neutral-700">
            {formatRupiah(payment.amount)} untuk {title.toLowerCase()} via{" "}
            {payment.method === "va" && payment.bank
              ? `Virtual Account ${BANK_LABEL[payment.bank]}`
              : PAYMENT_METHOD_LABEL[payment.method]}
            {payment.paid_at ? ` · ${formatDate(payment.paid_at, true)}` : ""}
          </p>
          <p className="text-sm text-neutral-600">
            {isTopup
              ? "Saldo Agriloss kamu sudah bertambah."
              : payment.method === "tunai"
                ? "Petani sudah mengonfirmasi uang tunai diterima. Bahan baku sudah masuk ke Stok."
                : "Bahan baku sudah masuk ke Stok, petani menerima penuh nilai buah di Saldo Agriloss-nya."}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {isTopup ? (
              <LinkButton href="/dashboard/umkm/saldo">Lihat Saldo</LinkButton>
            ) : (
              <>
                <LinkButton href="/dashboard/umkm/stok">Lihat Stok</LinkButton>
                <LinkButton href="/dashboard/umkm/laporan" variant="outline">
                  Laporan Keuangan
                </LinkButton>
              </>
            )}
          </div>
        </section>
      </Container>
    );
  }

  // ───────── Dibatalkan / kedaluwarsa ─────────
  if (payment.status === "dibatalkan" || expired) {
    return (
      <Container className="pt-6 sm:pt-10">
        <section className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-4xl bg-white/80 p-8 text-center shadow-card">
          <Mascot pose="sad" width={140} />
          <h1 className="text-3xl font-bold">
            {expired ? "Tagihan Kedaluwarsa" : "Tagihan Dibatalkan"}
          </h1>
          <p className="text-neutral-700">
            {expired
              ? "Batas waktu pembayaran sudah lewat."
              : "Tagihan ini sudah dibatalkan."}{" "}
            Buat pembayaran baru bila masih ingin melanjutkan.
          </p>
          <LinkButton href={backHref}>
            {isTopup ? "Kembali ke Saldo" : "Kembali ke Penawaran"}
          </LinkButton>
        </section>
      </Container>
    );
  }

  // ───────── Menunggu pembayaran ─────────
  return (
    <Container className="pt-6 sm:pt-10">
      <Link
        href={backHref}
        className="mb-4 inline-block text-sm font-semibold text-leaf-800 hover:underline"
      >
        ← Kembali
      </Link>
      <PageTitle title="Selesaikan Pembayaran" description={title} />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="flex flex-col gap-6 rounded-4xl bg-white/85 p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Total tagihan
              </p>
              <p className="text-4xl font-bold text-ink">
                {formatRupiah(payment.amount)}
              </p>
            </div>
            <PaymentLive secondsLeft={secondsUntil(payment.expires_at)} cash={payment.method === "tunai"} />
          </div>

          {payment.method === "tunai" ? (
            <div className="flex flex-col gap-4 rounded-3xl border-2 border-dashed border-leaf-300 p-5">
              <p className="flex items-center gap-2 text-lg font-bold">
                <Icon name="cash" size={22} className="text-leaf-700" /> Bayar
                Tunai (COD)
              </p>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-neutral-700">
                <li>
                  Siapkan uang tunai tepat {formatRupiah(payment.amount)}, tanpa
                  biaya layanan.
                </li>
                <li>Serahkan langsung ke petani saat menjemput buah.</li>
                <li>
                  Petani menekan &quot;Uang sudah saya terima&quot; di akunnya,
                  lalu transaksi selesai dan stok masuk otomatis.
                </li>
              </ol>
              <p className="text-sm text-neutral-600">
                Tagihan tunai berlaku 3 hari. Halaman ini berubah otomatis
                setelah petani mengonfirmasi.
              </p>
            </div>
          ) : payment.method === "qris" ? (
            <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-leaf-300 p-5 text-center">
              <p className="flex items-center gap-2 text-lg font-bold">
                <Icon name="qr" size={22} className="text-leaf-700" /> QRIS ·
                Agriloss.Connect
              </p>
              <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-leaf-200">
                <QRCodeSVG
                  value={simulatorUrl}
                  size={220}
                  marginSize={1}
                  fgColor="#1c3a2e"
                  title="QRIS pembayaran (simulasi)"
                />
              </div>
              <p className="max-w-sm text-sm text-neutral-700">
                Pindai QR dengan kamera HP untuk membuka{" "}
                <b>simulator pembayaran</b>, lalu tekan Bayar. Halaman ini akan
                berubah otomatis begitu pembayaran berhasil.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 rounded-3xl border-2 border-dashed border-leaf-300 p-5">
              <p className="flex items-center gap-2 text-lg font-bold">
                <Icon name="bank" size={22} className="text-leaf-700" /> Virtual
                Account {payment.bank ? BANK_LABEL[payment.bank] : ""}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-leaf-50 px-4 py-3">
                <p className="font-mono text-xl font-bold tabular-nums sm:text-2xl sm:tracking-wider">
                  {payment.va_number?.replace(/(\d{4})(?=\d)/g, "$1 ")}
                </p>
                {payment.va_number && (
                  <CopyButton value={payment.va_number} label="Salin nomor" />
                )}
              </div>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-neutral-700">
                <li>
                  Buka m-banking / ATM{" "}
                  {payment.bank ? BANK_LABEL[payment.bank] : ""}.
                </li>
                <li>Pilih menu Transfer → Virtual Account.</li>
                <li>
                  Masukkan nomor di atas, pastikan nama tujuan
                  &quot;Agriloss.Connect&quot;.
                </li>
                <li>
                  Bayar tepat {formatRupiah(payment.amount)}, status akan
                  berubah otomatis.
                </li>
              </ol>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {payment.method !== "tunai" && (
              <a
                href={simulatorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("primary", "md")}
              >
                <Icon name="phone" /> Buka Simulator Pembayaran
              </a>
            )}
            <form action={cancelPayment}>
              <input type="hidden" name="id" value={payment.id} />
              <button
                type="submit"
                className={buttonClass(
                  "ghost",
                  "md",
                  "text-red-700 hover:bg-red-50",
                )}
              >
                Batalkan tagihan
              </button>
            </form>
          </div>
          {payment.method !== "tunai" && (
            <p className="rounded-xl bg-sun-soft px-4 py-2 text-xs text-[#8a4b05]">
              Mode simulasi untuk keperluan demo: tidak ada uang sungguhan yang
              berpindah. Di versi produksi, langkah ini digantikan payment
              gateway berizin Bank Indonesia.
            </p>
          )}
        </section>

        <aside className="flex h-fit flex-col gap-4 rounded-4xl bg-leaf-900 p-6 text-white sm:p-8">
          <h2 className="text-xl font-bold">Rincian</h2>
          <dl className="grid gap-2 text-sm">
            {isTopup ? (
              <div className="flex justify-between">
                <dt>Isi saldo</dt>
                <dd>{formatRupiah(payment.subtotal)}</dd>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <dt>Subtotal buah</dt>
                  <dd>{formatRupiah(payment.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Biaya layanan Agriloss</dt>
                  <dd>{formatRupiah(payment.service_fee)}</dd>
                </div>
              </>
            )}
            <div className="mt-1 flex justify-between border-t border-white/20 pt-2 text-base font-bold text-lime">
              <dt>Total</dt>
              <dd>{formatRupiah(payment.amount)}</dd>
            </div>
          </dl>
          <p className="text-xs text-leaf-100">
            {payment.method === "tunai" ? "Berlaku sampai" : "Bayar sebelum"}{" "}
            {formatDate(payment.expires_at, true)}.{" "}
            {isTopup
              ? "Saldo bertambah setelah pembayaran berhasil."
              : payment.method === "tunai"
                ? "Uang tunai diterima langsung oleh petani."
                : "Petani menerima penuh nilai buah ke Saldo Agriloss setelah lunas."}
          </p>
        </aside>
      </div>
    </Container>
  );
}
