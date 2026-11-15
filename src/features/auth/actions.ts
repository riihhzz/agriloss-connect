"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState, UserRole } from "@/types/database";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/** Hanya izinkan redirect internal (cegah open redirect). */
function safeNext(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

/** Terjemahkan kode error Supabase Auth menjadi pesan yang ramah pengguna. */
function signUpErrorMessage(code: string | undefined) {
  switch (code) {
    case "user_already_exists":
    case "email_exists":
      return "Email sudah terdaftar. Silakan masuk.";
    case "email_address_invalid":
      return "Alamat email tidak dapat digunakan. Gunakan email aktif lain.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Terlalu banyak pendaftaran dalam waktu singkat. Coba lagi beberapa menit lagi.";
    case "weak_password":
      return "Password terlalu lemah. Gunakan kombinasi huruf dan angka.";
    default:
      return "Pendaftaran gagal. Silakan coba lagi.";
  }
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = text(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email) || !password) {
    return { ok: false, message: "Masukkan email dan password yang valid." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "Email belum dikonfirmasi. Silakan cek kotak masuk email kamu."
        : "Email atau password salah.";
    return { ok: false, message };
  }

  redirect(safeNext(text(formData, "next")));
}

export async function register(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const role = text(formData, "role") as UserRole;
  const fullName = text(formData, "full_name");
  const businessName = text(formData, "business_name");
  const email = text(formData, "email");
  const whatsapp = text(formData, "whatsapp");
  const location = text(formData, "location");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (role !== "petani" && role !== "umkm") return { ok: false, message: "Peran tidak valid." };
  if (fullName.length < 3) return { ok: false, message: "Nama lengkap minimal 3 karakter." };
  if (role === "umkm" && businessName.length < 2) return { ok: false, message: "Nama usaha wajib diisi." };
  if (!EMAIL_RE.test(email)) return { ok: false, message: "Format email tidak valid." };
  if (!/^(\+62|62|0)8\d{7,12}$/.test(whatsapp.replace(/[\s-]/g, ""))) {
    return { ok: false, message: "Nomor HP tidak valid (contoh: 081234567890)." };
  }
  if (location.length < 3) return { ok: false, message: "Lokasi wajib diisi." };
  if (password.length < 8) return { ok: false, message: "Password minimal 8 karakter." };
  if (password !== confirm) return { ok: false, message: "Konfirmasi password tidak sama." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: fullName,
        business_name: role === "umkm" ? businessName : "",
        whatsapp: whatsapp.replace(/[\s-]/g, ""),
        location,
      },
    },
  });

  if (error) return { ok: false, message: signUpErrorMessage(error.code) };

  // Setelah daftar, pengguna diarahkan ke halaman Masuk (bukan langsung login).
  // Jika Supabase sempat membuat sesi, tutup dulu agar alurnya konsisten.
  if (data.session) await supabase.auth.signOut();

  const status = data.session ? "berhasil" : "cek-email";
  redirect(`/masuk?daftar=${status}&email=${encodeURIComponent(email)}`);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
