import { Avatar } from "@/components/ui/Avatar";
import { buttonClass } from "@/components/ui/Button";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { AvatarUploadButton } from "@/features/profile/components/AvatarUploadButton";
import { logout } from "@/features/auth/actions";
import { ROLE_LABEL } from "@/lib/constants";
import { displayName } from "@/lib/utils";
import type { Profile } from "@/types/database";

/** Banner hijau profil: foto, nama, lencana peran, tombol Ubah Foto & Keluar. */
export function ProfileHeader({ profile }: { profile: Profile }) {
  const name = displayName(profile);
  return (
    <section className="flex flex-col items-center gap-6 rounded-[2.5rem] bg-leaf-700 px-6 py-8 text-white sm:flex-row sm:px-10">
      <Avatar name={name} url={profile.avatar_url} size={168} className="border-4 border-white/20 max-sm:!h-28 max-sm:!w-28" />
      <div className="flex flex-1 flex-col items-center gap-3 sm:items-start">
        <h2 className="text-center text-3xl font-bold sm:text-left sm:text-5xl">{name}</h2>
        <span className="rounded-full bg-lime px-4 py-1.5 text-sm font-bold text-ink">{ROLE_LABEL[profile.role]}</span>
      </div>
      <div className="flex gap-3 sm:flex-col">
        <AvatarUploadButton />
        <form action={logout}>
          <ConfirmSubmit
            title="Keluar dari akun?"
            message="Kamu perlu masuk kembali untuk mengelola penawaran dan data akunmu."
            confirmLabel="Ya, keluar"
            cancelLabel="Tetap di sini"
            className={buttonClass("lime", "md", "w-full min-w-36 font-bold")}
          >
            Keluar
          </ConfirmSubmit>
        </form>
      </div>
    </section>
  );
}
