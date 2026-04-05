"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

export function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase || loading) {
      return;
    }

    setLoading(true);
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <Button
      variant="ghost"
      className="w-full justify-start"
      onClick={handleLogout}
      disabled={loading}
    >
      <LogOut className="size-4" />
      {loading ? "Đang đăng xuất..." : "Đăng xuất"}
    </Button>
  );
}
