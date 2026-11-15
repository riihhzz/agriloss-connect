import { NavShell } from "@/components/layout/NavShell";
import { MobileAccountCard, MobileLogout, UserMenu } from "@/components/layout/UserMenu";
import { LinkButton } from "@/components/ui/Button";
import { getCurrentProfile } from "@/lib/auth";
import { DASHBOARD_HOME, PUBLIC_NAV, ROLE_LABEL } from "@/lib/constants";
import { displayName } from "@/lib/utils";

export async function PublicNavbar() {
  const profile = await getCurrentProfile();

  return (
    <NavShell
      items={PUBLIC_NAV}
      actions={
        profile ? (
          <>
            <LinkButton href={DASHBOARD_HOME[profile.role]} variant="ghost" size="sm">
              Dashboard
            </LinkButton>
            <UserMenu
              name={displayName(profile)}
              avatarUrl={profile.avatar_url}
              roleLabel={ROLE_LABEL[profile.role]}
              basePath={DASHBOARD_HOME[profile.role]}
            />
          </>
        ) : (
          <LinkButton href="/masuk" size="sm" className="px-6">
            Masuk
          </LinkButton>
        )
      }
      mobileHeader={
        profile && (
          <MobileAccountCard
            name={displayName(profile)}
            avatarUrl={profile.avatar_url}
            roleLabel={ROLE_LABEL[profile.role]}
            basePath={DASHBOARD_HOME[profile.role]}
          />
        )
      }
      mobileFooter={
        profile ? (
          <div className="flex flex-col gap-3">
            <LinkButton href={DASHBOARD_HOME[profile.role]} className="w-full">
              Buka Dashboard
            </LinkButton>
            <MobileLogout />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <LinkButton href="/pilih-peran" variant="outline" className="w-full bg-white">
              Daftar
            </LinkButton>
            <LinkButton href="/masuk" className="w-full">
              Masuk
            </LinkButton>
          </div>
        )
      }
    />
  );
}
