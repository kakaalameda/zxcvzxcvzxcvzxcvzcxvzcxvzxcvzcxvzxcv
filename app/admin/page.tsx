import { redirect } from "next/navigation";
import { getOptionalAdminSession } from "@/lib/auth/admin";

export default async function AdminPage() {
  const adminSession = await getOptionalAdminSession();
  redirect(adminSession ? "/admin/orders" : "/admin/login");
}
