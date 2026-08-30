"use server";

import { createClient } from "@/lib/supabase/server";

export interface UploadResult {
  url?: string;
  error?: string;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Uploads an image file to the "site-media" Supabase Storage bucket.
 * Bucket must be created once in Supabase (public read, admin/dev write —
 * see supabase/storage-setup.sql).
 */
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to upload images." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No file provided." };

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Unsupported file type. Please upload a JPG, PNG, WebP, GIF, or SVG." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: "File is too large. Maximum size is 5MB." };
  }

  const ext = file.name.split(".").pop() || "png";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("site-media").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    console.error("uploadImage error:", uploadError.message);
    return { error: "Failed to upload image. Please try again." };
  }

  const { data } = supabase.storage.from("site-media").getPublicUrl(path);
  return { url: data.publicUrl };
}
