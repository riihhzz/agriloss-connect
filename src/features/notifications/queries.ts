import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/types/database";

export async function getMyNotifications(limit = 10): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Notification[]) ?? [];
}
