"use server";

import { createClient } from "@/lib/supabase/server";

export interface UploadResult {
  url?: string;
  error?: string;
}

/**
 * SVG is deliberately NOT allowed.
 *
 * The site-media bucket is public, so an uploaded .svg is served from the
 * Supabase storage origin as `image/svg+xml` — and SVG can carry <script>
 * and event handlers. Anyone who can upload (including a staff account)
 * could then hand out a link that executes script in the context of that
 * origin. The bucket's own allowed_mime_types list has been narrowed to
 * match; this is the application-side half of the same fix.
 */
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Uploads an image file to the "site-media" Supabase Storage bucket.
 * Bucket must be created once in Supabase (public read, panel-role write —
 * see supabase/storage-setup.sql).
 */
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to upload images." };

  // Storage RLS enforces this too, but check here so the user gets a real
  // message instead of an opaque storage error.
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "developer", "staff"].includes(profile.role)) {
    return { error: "You don't have permission to upload images." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No file provided." };

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return { error: "Unsupported file type. Please upload a JPG, PNG, WebP or GIF." };
  }
  if (file.size === 0) {
    return { error: "That file is empty." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: "File is too large. Maximum size is 5MB." };
  }

  // Extension is derived from the validated MIME type, never from the
  // user-supplied filename. The old version used
  // `file.name.split(".").pop()`, so a file named `x.html` (or one with a
  // path separator in its name) decided the stored object's key and the
  // extension browsers would infer from the public URL.
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
