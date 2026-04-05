import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getOptionalAdminSession } from "@/lib/auth/admin";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const adminSession = await getOptionalAdminSession();
  if (adminSession) {
    redirect("/admin/orders");
  }

  const resolvedSearchParams = await searchParams;
  const nextParam = resolvedSearchParams.next;
  const next =
    typeof nextParam === "string"
      ? nextParam
      : Array.isArray(nextParam)
        ? nextParam[0]
        : "/admin/orders";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(245,168,0,0.12),transparent_40%),#050505] px-6 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-black/70 p-8 backdrop-blur">
        <p className="font-heading text-xs uppercase tracking-[0.35em] text-gold-500">
          Admin Login
        </p>
        <h1 className="mt-4 font-display text-5xl leading-none tracking-wide">
          DASH<span className="text-gold-500">BOARD</span>
        </h1>
        <p className="mt-4 text-sm text-white/60">
          Sign in with an approved Supabase Auth admin account.
        </p>

        <div className="mt-8">
          <AdminLoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
