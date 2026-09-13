/**
 * Downscales and re-compresses an image in the browser before upload, so a
 * 12MP phone photo doesn't get stored (and served to every site visitor) at
 * full resolution. Runs entirely client-side via <canvas> — no server
 * dependency, so it works the same on any hosting target.
 *
 * Skips SVG (vector, nothing to compress) and GIF (canvas re-encoding would
 * silently drop animation frames). Falls back to the original file untouched
 * if anything goes wrong, or if compression didn't actually save space.
 */
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

    // PNGs with transparency stay PNG (re-encoding as JPEG would flatten
    // transparent pixels to black); everything else becomes JPEG, which
    // compresses photos far better than PNG/WebP re-encoding at this quality.
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
