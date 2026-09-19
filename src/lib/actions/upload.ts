"use server";

import { createClient } from "@/lib/supabase/server";
import { sniffImageType } from "@/lib/image-sniff";

export interface UploadResult {
  url?: string;
  error?: string;
}

/* SVG is not allowed.
   The site-media bucket is public. A browser serves uploaded SVG files as
   image/svg+xml. SVG can contain <script> elements and event handlers.
   Any user with upload access, including staff, could upload a malicious
   SVG and share the public URL to run scripts on the storage origin.
   The bucket's allowed_mime_types list is also restricted to match this
   server-side check. Both restrictions must stay in place. */
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/* Upload an image file to the site-media Supabase Storage bucket.
   Create the bucket once in Supabase before using this function.
   See supabase/storage-setup.sql for the bucket configuration. */
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to upload images." };

  /* Check the role here so the user receives a clear error message.
     Storage Row Level Security also enforces this check. */
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "developer", "staff"].includes(profile.role)) {
    return { error: "You do not have permission to upload images." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No file provided." };

  if (file.size === 0) {
    return { error: "The file is empty." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: "File is too large. The maximum size is 5 MB." };
  }

  /* Decide the type from the file's actual bytes. file.type is whatever the
     browser (or an attacker) claims, so it is only checked for consistency.
     The detected type — never the claimed one — sets the extension and the
     stored Content-Type. */
  const detected = sniffImageType(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
  const ext = detected ? ALLOWED_TYPES[detected] : undefined;
  if (!detected || !ext || (file.type && file.type !== detected)) {
    return { error: "Unsupported or damaged file. Upload a JPG, PNG, WebP, or GIF image." };
  }

  /* Derive the file extension from the validated MIME type.
     Do not use the user-supplied filename. The old code used
     file.name.split(".").pop(), which allowed a file named x.html to
     control the stored object key and the extension that browsers infer
     from the public URL. */
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("site-media").upload(path, file, {
    contentType: detected,
    upsert: false,
  });

  if (uploadError) {
    console.error("uploadImage error:", uploadError.message);
    return { error: "Failed to upload image. Please try again." };
  }

  const { data } = supabase.storage.from("site-media").getPublicUrl(path);
  return { url: data.publicUrl };
}
