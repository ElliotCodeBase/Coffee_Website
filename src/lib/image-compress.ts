/* Reduce the size and resolution of an image in the browser before upload.
   This prevents large phone photos from being stored and served to site
   visitors at full resolution. The function runs entirely in the browser
   using a canvas element. It does not require a server.

   SVG files are skipped because they are vector images and do not benefit
   from compression. GIF files are skipped because the canvas API would
   remove animation frames during re-encoding. If anything goes wrong, or
   if compression does not reduce the file size, the function returns the
   original file unchanged. */
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;

export async function compressImage(file: File): Promise<File> {
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);

    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    /* Keep PNG files as PNG to preserve transparency. Converting a PNG
       with a transparent background to JPEG would fill the transparent
       area with black. Convert all other formats to JPEG, which compresses
       photos more efficiently than PNG or WebP at this quality level. */
    const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, outputType, JPEG_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const ext = outputType === "image/png" ? "png" : "jpg";
    const newName = file.name.replace(/\.[^.]+$/, "") + `.${ext}`;
    return new File([blob], newName, { type: outputType });
  } catch (err) {
    console.error("Image compression skipped:", err);
    return file;
  }
}
