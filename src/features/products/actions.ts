"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { neonDatabase } from "@/lib/database";
import { publishProductTransaction, saveProductSpecificationTransaction } from "./service";

export async function saveProductSpecification(productId: string, input: unknown) {
  const admin = await requireAdmin();
  const result = await saveProductSpecificationTransaction(neonDatabase, productId, input, admin.id);
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/tools");
  revalidatePath(`/tools/${result.specification.slug}`);
  return result;
}

export async function saveProductSpecificationForm(productId: string, formData: FormData) {
  const raw = String(formData.get("specification") ?? "");
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    throw new Error("Product Specificationは有効なJSONで入力してください。");
  }
  await saveProductSpecification(productId, input);
}

export async function publishProduct(productId: string) {
  await requireAdmin();
  const published = await publishProductTransaction(neonDatabase, productId);
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/tools");
  revalidatePath(`/tools/${published.slug}`);
  redirect(`/admin/products/${productId}`);
}
