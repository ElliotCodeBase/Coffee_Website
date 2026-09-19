"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MenuCategory } from "@/types/database";

export interface ActionResult {
  success?: boolean;
  error?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MENU_ROLES = ["admin", "developer", "staff"];

/* Verify that the current user can manage menu items.
   Server actions are public endpoints. A user who cannot open /admin/menu
   can still POST to these actions directly. Row Level Security also blocks
   the write, but this check returns a clear error message. */
async function assertCanManageMenu(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return !!profile && MENU_ROLES.includes(profile.role);
}

function parseCategory(value: FormDataEntryValue | null): MenuCategory {
  return value === "pastries" ? "pastries" : "drinks";
}

export async function createMenuItem(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await assertCanManageMenu(supabase))) {
    return { error: "You do not have permission to manage the menu." };
  }

  const price = Number(formData.get("price"));
  if (!Number.isFinite(price) || price < 0 || price > 9999.99) {
    return { error: "Enter a valid price between 0 and 9999.99." };
  }

  const name = String(formData.get("name") || "").trim();
  if (!name || name.length > 120) return { error: "Name is required (maximum 120 characters)." };

  const { error } = await supabase.from("menu_items").insert([
    {
      name,
      category: parseCategory(formData.get("category")),
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
  if (!UUID_RE.test(id)) return { error: "Invalid menu item." };

  const supabase = await createClient();
  if (!(await assertCanManageMenu(supabase))) {
    return { error: "You do not have permission to manage the menu." };
  }

  const price = Number(formData.get("price"));
  if (!Number.isFinite(price) || price < 0 || price > 9999.99) {
    return { error: "Enter a valid price between 0 and 9999.99." };
  }

  const name = String(formData.get("name") || "").trim();
  if (!name || name.length > 120) return { error: "Name is required (maximum 120 characters)." };

  const { error } = await supabase
    .from("menu_items")
    .update({
      name,
      category: parseCategory(formData.get("category")),
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
  if (!UUID_RE.test(id)) return { error: "Invalid menu item." };

  const supabase = await createClient();
  if (!(await assertCanManageMenu(supabase))) {
    return { error: "You do not have permission to manage the menu." };
  }

  const { error } = await supabase.from("menu_items").delete().eq("id", id);

  if (error) {
    console.error("deleteMenuItem error:", error.message);
    return { error: "Failed to delete menu item." };
  }

  revalidatePath("/");
  revalidatePath("/admin/menu");
  return { success: true };
}
