"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ServiceIcon } from "@/types/database";

export interface ActionResult {
  success?: boolean;
  error?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Unlike menu_items (admin/developer/staff), the Services section is
   ADMIN/DEVELOPER ONLY — staff cannot reach /admin/services at all (see
   AdminSidebar's ADMIN_ONLY_NAV), and this check is the second line of
   defense against a direct POST to the action. */
const SERVICE_ROLES = ["admin", "developer"];
const ICONS: ServiceIcon[] = ["coffee", "pastry", "seat", "award", "leaf", "wifi"];

async function assertCanManageServices(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return !!profile && SERVICE_ROLES.includes(profile.role);
}

function parseIcon(value: FormDataEntryValue | null): ServiceIcon {
  const str = String(value || "");
  return (ICONS as string[]).includes(str) ? (str as ServiceIcon) : "coffee";
}

export async function createServiceItem(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  if (!(await assertCanManageServices(supabase))) {
    return { error: "You do not have permission to manage services." };
  }

  const title = String(formData.get("title") || "").trim();
  if (!title || title.length > 120) return { error: "Title is required (maximum 120 characters)." };

  const description = String(formData.get("description") || "").trim();
  if (description.length > 400) return { error: "Description is too long (maximum 400 characters)." };

  const { error } = await supabase.from("service_items").insert([
    {
      title,
      description: description || null,
      icon: parseIcon(formData.get("icon")),
      is_visible: formData.get("is_visible") === "on",
      sort_order: Number(formData.get("sort_order")) || 0,
    },
  ]);

  if (error) {
    console.error("createServiceItem error:", error.message);
    return { error: "Failed to create service." };
  }

  revalidatePath("/");
  revalidatePath("/admin/services");
  return { success: true };
}

export async function updateServiceItem(id: string, formData: FormData): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { error: "Invalid service item." };

  const supabase = await createClient();
  if (!(await assertCanManageServices(supabase))) {
    return { error: "You do not have permission to manage services." };
  }

  const title = String(formData.get("title") || "").trim();
  if (!title || title.length > 120) return { error: "Title is required (maximum 120 characters)." };

  const description = String(formData.get("description") || "").trim();
  if (description.length > 400) return { error: "Description is too long (maximum 400 characters)." };

  const { error } = await supabase
    .from("service_items")
    .update({
      title,
      description: description || null,
      icon: parseIcon(formData.get("icon")),
      is_visible: formData.get("is_visible") === "on",
      sort_order: Number(formData.get("sort_order")) || 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("updateServiceItem error:", error.message);
    return { error: "Failed to update service." };
  }

  revalidatePath("/");
  revalidatePath("/admin/services");
  return { success: true };
}

export async function deleteServiceItem(id: string): Promise<ActionResult> {
  if (!UUID_RE.test(id)) return { error: "Invalid service item." };

  const supabase = await createClient();
  if (!(await assertCanManageServices(supabase))) {
    return { error: "You do not have permission to manage services." };
  }

  const { error } = await supabase.from("service_items").delete().eq("id", id);

  if (error) {
    console.error("deleteServiceItem error:", error.message);
    return { error: "Failed to delete service." };
  }

  revalidatePath("/");
  revalidatePath("/admin/services");
  return { success: true };
}
