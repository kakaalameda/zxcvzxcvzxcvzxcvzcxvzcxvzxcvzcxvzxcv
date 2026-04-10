import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import {
  createSupabaseRouteClient,
  createSupabaseServerComponentClient,
} from "@/lib/supabase/ssr";
import { isAllowedAdminEmail } from "@/lib/auth/admin-config";

export async function getOptionalAdminSession() {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAllowedAdminEmail(user.email)) {
      return null;
    }

    return { supabase, user };
  } catch (error) {
    console.error("[Auth Error]:", error);
    return null;
  }
}

export async function requireAdminPageAccess() {
  const session = await getOptionalAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return session;
}

export async function getAdminRouteContext(): Promise<{
  supabase: Awaited<ReturnType<typeof createSupabaseRouteClient>>;
  user: User;
} | null> {
  try {
    const supabase = await createSupabaseRouteClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAllowedAdminEmail(user.email)) {
      return null;
    }

    return { supabase, user };
  } catch (error) {
    console.error("[Auth Error]:", error);
    return null;
  }
}
