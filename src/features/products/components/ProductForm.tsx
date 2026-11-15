"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveProduct } from "@/features/products/actions";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { FRUIT_SUGGESTIONS, PRODUCT_CATEGORY_LABEL } from "@/lib/constants";
import { FormMessage } from "@/components/ui/FormMessage";
import { ImageInput } from "@/components/ui/ImageInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Product } from "@/types/database";

/** Form "Tambah Katalog" / "Ubah Produk". */
export function ProductForm({ product }: { product?: Product }) {
  const [state, action] = useActionState(saveProduct, null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!state?.ok) return;
    if (product) router.push("/dashboard/umkm/katalog");
    else formRef.current?.reset();
  }, [state, product, router]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-5">
      {product && <input type="hidden" name="id" value={product.id} />}
      <ImageInput key={state?.ok ? "reset" : "image"} name="image" label="Upload Produk" defaultUrl={product?.image_url} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nama Produk" htmlFor="name">
          <Input id="name" name="name" defaultValue={product?.name} placeholder="Es Krim Melon" required minLength={2} />
        </Field>
        <Field label="Harga (Rp)" htmlFor="price">
          <Input id="price" name="price" type="number" min={1} step={1} defaultValue={product?.price} placeholder="15000" required />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Kategori" htmlFor="category">
          <Select id="category" name="category" defaultValue={product?.category ?? "minuman"}>
            {Object.entries(PRODUCT_CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Buah bahan baku" htmlFor="fruit" hint="Buah utama dari petani yang dipakai untuk produk ini.">
          <Input id="fruit" name="fruit" list="product-fruit-list" defaultValue={product?.fruit ?? ""} placeholder="Mangga" />
          <datalist id="product-fruit-list">
            {FRUIT_SUGGESTIONS.map((fruit) => (
              <option key={fruit} value={fruit} />
            ))}
          </datalist>
        </Field>
      </div>
      <Field label="Deskripsi (opsional)" htmlFor="description">
        <Textarea id="description" name="description" defaultValue={product?.description ?? ""} placeholder="Bahan dari melon lokal Ciwidey..." />
      </Field>
      <label className="inline-flex w-fit cursor-pointer items-center gap-3 text-sm font-semibold">
        <input type="checkbox" name="is_available" defaultChecked={product?.is_available ?? true} className="h-5 w-5 accent-leaf-700" />
        Tersedia (tampil di katalog publik)
      </label>

      <FormMessage state={state} />

      <SubmitButton variant="lime" size="lg" className="w-full rounded-2xl sm:ml-auto sm:w-60" pendingText="Menyimpan...">
        Simpan Produk
      </SubmitButton>
    </form>
  );
}
