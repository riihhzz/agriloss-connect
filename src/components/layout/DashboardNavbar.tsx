import Link from "next/link";
import { NavShell } from "@/components/layout/NavShell";
import { MobileAccountCard, MobileLogout, UserMenu } from "@/components/layout/UserMenu";
import { getUnreadChatCount } from "@/features/chat/queries";
import { getBalance } from "@/features/payments/queries";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { getMyNotifications } from "@/features/notifications/queries";
import { getCurrentProfile } from "@/lib/auth";
import { DASHBOARD_HOME, DASHBOARD_NAV, ROLE_LABEL } from "@/lib/constants";
import { displayName } from "@/lib/utils";
import type { UserRole } from "@/types/database";
import { Icon } from "@/components/ui/Icon";

export async function DashboardNavbar({ role }: { role: UserRole }) {
  const [profile, notifications] = await Promise.all([getCurrentProfile(), getMyNotifications()]);
  const [unreadChats, balance] = profile ? await Promise.all([getUnreadChatCount(profile.id), getBalance(profile.id)]) : [0, 0];
  const home = DASHBOARD_HOME[role];

  return (
    <NavShell
      items={DASHBOARD_NAV[role]}
      logoHref={home}
      exactRoot={home}
      barActions={
        <>
          <Link
            href={`${home}/chat`}
            aria-label={unreadChats > 0 ? `Chat, ${unreadChats} pesan belum dibaca` : "Chat"}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-leaf-700 hover:bg-leaf-200"
          >
            <Icon name="chat" size={24} />
            {unreadChats > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sun px-1 text-[10px] font-bold text-white">
                {unreadChats}
              </span>
            )}
          </Link>
          <NotificationBell notifications={notifications} />
        </>
      }
      actions={
        profile && <UserMenu name={displayName(profile)} avatarUrl={profile.avatar_url} roleLabel={ROLE_LABEL[role]} basePath={home} balance={balance} />
      }
      mobileHeader={
        profile && (
          <MobileAccountCard name={displayName(profile)} avatarUrl={profile.avatar_url} roleLabel={ROLE_LABEL[role]} basePath={home} />
        )
      }
      mobileFooter={<MobileLogout />}
    />
  );
}
