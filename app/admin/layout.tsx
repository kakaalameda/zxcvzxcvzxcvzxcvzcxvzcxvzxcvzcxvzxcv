import { getOptionalAdminSession } from "@/lib/auth/admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminSession = await getOptionalAdminSession();

  if (!adminSession) {
    return children;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white lg:flex">
      <AdminSidebar email={adminSession.user.email ?? "admin"} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
