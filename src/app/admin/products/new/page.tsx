import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { NewProductForm } from "@/components/admin/new-product-form";
import { getAdminUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export default async function NewProductPage() {
  if (!(await getAdminUser())) redirect("/admin/login");
  return <main className="container"><AdminHeader /><NewProductForm /></main>;
}
