import { requireAdmin } from "@/lib/auth";
import { ApiError, handle, ok } from "@/lib/api";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, processImage } from "@/lib/images";

export const runtime = "nodejs";

/** Multipart image upload (field "files"). Each image becomes 3 WebP sizes + blur placeholder. */
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const form = await req.formData().catch(() => null);
  if (!form) throw new ApiError("Expected multipart form data");
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) throw new ApiError("No files received");
  if (files.length > 12) throw new ApiError("Upload at most 12 images at once");
  const images = [];
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new ApiError(`${file.name}: unsupported type (use JPG, PNG, WebP, GIF or AVIF)`, 415);
    if (file.size > MAX_UPLOAD_BYTES) throw new ApiError(`${file.name}: file is larger than 8 MB`, 413);
    const buf = Buffer.from(await file.arrayBuffer());
    try {
      images.push(await processImage(buf, file.name.replace(/\.[^.]+$/, ""), ""));
    } catch {
      throw new ApiError(`${file.name}: could not read image`, 422);
    }
  }
  return ok({ images }, { status: 201 });
});
