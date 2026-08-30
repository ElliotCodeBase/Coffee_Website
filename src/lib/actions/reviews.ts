"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ActionResult {
  success?: boolean;
  error?: string;
}

export async function createReview(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const author_name = String(formData.get("author_name") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const rating = Number(formData.get("rating"));

  if (!author_name) return { error: "Author name is required." };
  if (!body) return { error: "Review text is required." };
  if (Number.isNaN(rating) || rating < 1 || rating > 5) return { error: "Rating must be 1-5." };

  const { error } = await supabase.from("reviews").insert([
    {
      author_name,
      body,
      rating,
      avatar_url: String(formData.get("avatar_url") || "") || null,
      is_published: formData.get("is_published") === "on",
      sort_order: Number(formData.get("sort_order")) || 0,
    },
  ]);

  if (error) {
    console.error("createReview error:", error.message);
    return { error: "Failed to create review." };
  }

  revalidatePath("/");
  revalidatePath("/admin/reviews");
  return { success: true };
}

export async function updateReview(id: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const author_name = String(formData.get("author_name") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const rating = Number(formData.get("rating"));

  if (!author_name) return { error: "Author name is required." };
  if (!body) return { error: "Review text is required." };
  if (Number.isNaN(rating) || rating < 1 || rating > 5) return { error: "Rating must be 1-5." };

  const { error } = await supabase
    .from("reviews")
    .update({
      author_name,
      body,
      rating,
      avatar_url: String(formData.get("avatar_url") || "") || null,
      is_published: formData.get("is_published") === "on",
      sort_order: Number(formData.get("sort_order")) || 0,
    })
    .eq("id", id);

  if (error) {
    console.error("updateReview error:", error.message);
    return { error: "Failed to update review." };
  }

  revalidatePath("/");
  revalidatePath("/admin/reviews");
  return { success: true };
}

export async function deleteReview(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);

  if (error) {
    console.error("deleteReview error:", error.message);
    return { error: "Failed to delete review." };
  }

  revalidatePath("/");
  revalidatePath("/admin/reviews");
  return { success: true };
}
