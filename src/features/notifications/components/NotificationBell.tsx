"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { markAllNotificationsRead } from "@/features/notifications/actions";
import type { Notification } from "@/types/database";
import { formatDate } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

export function NotificationBell({ notifications }: { notifications: Notification[] }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((item) => !item.is_read).length;

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) startTransition(() => markAllNotificationsRead());
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-leaf-700 hover:bg-leaf-200"
      >
        <Icon name="bell" size={24} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sun px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white shadow-card">
          <p className="border-b border-neutral-100 px-4 py-3 text-sm font-bold">Notifikasi</p>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-neutral-600">Belum ada notifikasi.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((item) => (
                <li key={item.id} className={item.is_read ? "" : "bg-leaf-50"}>
                  <Link href={item.link ?? "#"} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-leaf-100">
                    <p className="text-sm">{item.message}</p>
                    <p className="mt-1 text-xs text-neutral-500">{formatDate(item.created_at, true)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
