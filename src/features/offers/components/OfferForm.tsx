"use client";

import { useState } from "react";
import { FruitCheckPanel } from "@/features/ai/components/FruitCheckPanel";
import type { FruitCheckResult } from "@/features/ai/fruit-check";
import { createOffer } from "@/features/offers/actions";
import { OfferCriteria } from "@/features/offers/components/OfferCriteria";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { ImageInput } from "@/components/ui/ImageInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FRUIT_SUGGESTIONS, MIN_SHELF_LIFE_DAYS, RIPENESS_LABEL } from "@/lib/constants";
import { usePreservedFormAction } from "@/lib/hooks/usePreservedFormAction";
import { formatRupiah, savingsPercent } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

/** Form "Tambah Penawaran" milik petani, lengkap dengan ketentuan & peringatan kelayakan. */
export function OfferForm({ defaultLocation }: { defaultLocation?: string | null }) {
  const { state, onSubmit, pending } = usePreservedFormAction(createOffer);
  const [price, setPrice] = useState("");
  const [marketPrice, setMarketPrice] = useState("");
  const [shelfLife, setShelfLife] = useState("");
  const [fruitType, setFruitType] = useState("");
  const [ripeness, setRipeness] = useState("matang");
  const [photo, setPhoto] = useState<File | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [lastState, setLastState] = useState(state);

  // Setelah berhasil terkirim: kosongkan isian (form di-remount lewat key)
  if (state !== lastState) {
    setLastState(state);
    if (state?.ok) {
      setPrice("");
      setMarketPrice("");
      setShelfLife("");
      setFruitType("");
      setRipeness("matang");
      setPhoto(null);
      setFormKey((key) => key + 1);
    }
  }

  const applyAi = (result: FruitCheckResult) => {
    setFruitType(result.buah);
    setRipeness(result.kematangan);
    setShelfLife(String(result.perkiraan_layak_hari));
  };

  const saving = savingsPercent(Number(price), Number(marketPrice));
  const priceTooHigh = Boolean(price && marketPrice && Number(price) >= Number(marketPrice) * 0.8);
  const shelfLow = shelfLife !== "" && Number(shelfLife) < MIN_SHELF_LIFE_DAYS;

  return (
    <form key={formKey} onSubmit={onSubmit} className="flex flex-col gap-5">
      <OfferCriteria />

      <ImageInput key={`photo-${formKey}`} name="photo" label="Upload Kondisi Buah" onFileChange={setPhoto} />
      <FruitCheckPanel key={`ai-${formKey}`} file={photo} onApply={applyAi} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Jenis Buah" htmlFor="fruit_type">
          <Input
            id="fruit_type"
            name="fruit_type"
            list="fruit-list"
            placeholder="Pilih atau ketik jenis buah"
            required
            value={fruitType}
            onChange={(event) => setFruitType(event.target.value)}
          />
          <datalist id="fruit-list">
            {FRUIT_SUGGESTIONS.map((fruit) => (
              <option key={fruit} value={fruit} />
            ))}
          </datalist>
        </Field>
        <Field label="Tingkat Kematangan" htmlFor="ripeness">
          <Select id="ripeness" name="ripeness" value={ripeness} onChange={(event) => setRipeness(event.target.value)}>
            {Object.entries(RIPENESS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Jumlah (Kg)" htmlFor="quantity_kg">
          <Input id="quantity_kg" name="quantity_kg" type="number" min={0.1} step={0.1} inputMode="decimal" placeholder="16" required />
        </Field>
        <Field label="Harga Jual Agriloss (/Kg)" htmlFor="price_per_kg">
          <Input
            id="price_per_kg"
            name="price_per_kg"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="7000"
            required
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </Field>
        <Field label="Harga Pasar Normal (/Kg)" htmlFor="market_price_per_kg" hint="Harga buah ini di pasar saat kondisi bagus.">
          <Input
            id="market_price_per_kg"
            name="market_price_per_kg"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            placeholder="20000"
            value={marketPrice}
            onChange={(event) => setMarketPrice(event.target.value)}
          />
        </Field>
      </div>

      {saving !== null && !priceTooHigh && (
        <p className="rounded-xl bg-lime/50 px-4 py-2 text-sm font-semibold text-leaf-900">
          <Icon name="check-circle" /> Hemat {saving}% dibanding pasar ({formatRupiah(Number(marketPrice))} → {formatRupiah(Number(price))}/Kg). UMKM akan lebih tertarik.
        </p>
      )}
      {priceTooHigh && (
        <p role="alert" className="rounded-xl bg-sun-soft px-4 py-2 text-sm font-medium text-[#8a4b05]">
          <Icon name="warning" /> Harga masih dekat dengan harga pasar. Agriloss.Connect untuk hasil panen dengan harga <b>jauh di bawah pasar</b>.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Perkiraan Masih Layak Diolah (hari)" htmlFor="shelf_life_days" hint="Berapa hari lagi buah masih bisa diolah sebelum rusak.">
          <Input
            id="shelf_life_days"
            name="shelf_life_days"
            type="number"
            min={0}
            max={60}
            inputMode="numeric"
            placeholder="4"
            required
            value={shelfLife}
            onChange={(event) => setShelfLife(event.target.value)}
          />
        </Field>
        <Field label="Lokasi" htmlFor="location">
          <Input id="location" name="location" defaultValue={defaultLocation ?? ""} placeholder="Ciwidey, Bandung" required />
        </Field>
      </div>

      {shelfLow && (
        <p role="alert" className="rounded-xl bg-sun-soft px-4 py-2 text-sm font-medium text-[#8a4b05]">
          <Icon name="warning" /> Masa layak kurang dari {MIN_SHELF_LIFE_DAYS} hari. Penawaran tetap bisa dikirim, tetapi UMKM butuh waktu untuk menjemput &amp;
          mengolah — pastikan buah belum busuk.
        </p>
      )}

      <Field label="Catatan (opsional)" htmlFor="notes">
        <Textarea id="notes" name="notes" placeholder="Contoh: sisa musim, sebagian kulit tergores, rasa tetap manis." />
      </Field>

      <label className="flex items-start gap-3 rounded-xl bg-white/60 px-4 py-3 text-sm">
        <input type="checkbox" name="agree" required className="mt-0.5 h-5 w-5 shrink-0 accent-leaf-700" />
        <span>
          Saya menyatakan buah ini <b>bukan hasil panen premium dengan harga normal</b>, <b>tidak busuk</b>, dan dijual dengan harga di
          bawah pasar sesuai ketentuan Agriloss.Connect.
        </span>
      </label>

      <FormMessage state={state} />

      <SubmitButton pending={pending} size="lg" className="w-full rounded-2xl" pendingText="Mengirim...">
        Kirim Penawaran
      </SubmitButton>
    </form>
  );
}
