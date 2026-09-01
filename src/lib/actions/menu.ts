"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MenuCategory } from "@/types/database";

export interface ActionResult {
  success?: boolean;
  error?: string;
}

export async function createMenuItem(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const price = Number(formData.get("price"));
  if (Number.isNaN(price) || price < 0) {
    return { error: "Please enter a valid price." };
  }

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name is required." };

  const { error } = await supabase.from("menu_items").insert([
    {
      name,
      category: (formData.get("category") as MenuCategory) || "drinks",
      description: String(formData.get("description") || "") || null,
      price,
      badge: String(formData.get("badge") || "") || null,
      image_url: String(formData.get("image_url") || "") || null,
      is_available: formData.get("is_available") === "on",
      is_best_seller: formData.get("is_best_seller") === "on",
      is_new: formData.get("is_new") === "on",
      sort_order: Number(formData.get("sort_order")) || 0,
    },
  ]);

  if (error) {
    console.error("createMenuItem error:", error.message);
    return { error: "Failed to create menu item." };
  }

  revalidatePath("/");
  revalidatePath("/admin/menu");
  return { success: true };
}

export async function updateMenuItem(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const price = Number(formData.get("price"));
  if (Number.isNaN(price) || price < 0) {
    return { error: "Please enter a valid price." };
  }

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name is required." };

  const { error } = await supabase
    .from("menu_items")
    .update({
      name,
      category: (formData.get("category") as MenuCategory) || "drinks",
      description: String(formData.get("description") || "") || null,
      price,
      badge: String(formData.get("badge") || "") || null,
      image_url: String(formData.get("image_url") || "") || null,
      is_available: formData.get("is_available") === "on",
      is_best_seller: formData.get("is_best_seller") === "on",
      is_new: formData.get("is_new") === "on",
      sort_order: Number(formData.get("sort_order")) || 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("updateMenuItem error:", error.message);
    return { error: "Failed to update menu item." };
  }

  revalidatePath("/");
  revalidatePath("/admin/menu");
  return { success: true };
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);

  if (error) {
    console.error("deleteMenuItem error:", error.message);
    return { error: "Failed to delete menu item." };
  }

  revalidatePath("/");
  revalidatePath("/admin/menu");
  return { success: true };
}
