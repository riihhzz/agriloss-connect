import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Lewati aset statis & gambar
  matcher: ["/((?!_next/static|_next/image|images/|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
