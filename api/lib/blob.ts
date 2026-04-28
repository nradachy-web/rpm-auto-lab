import { put, del } from "@vercel/blob";

// Vercel Blob is provisioned for this project as the rpm-auto-lab-photos
// store. BLOB_READ_WRITE_TOKEN is auto-injected once the store is linked.
const MAX_BYTES = 12 * 1024 * 1024; // 12 MB per photo
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export async function uploadPhoto(args: {
  jobId: string;
  fileName: string;
  contentType: string;
  body: ReadableStream | Buffer | Blob | ArrayBuffer;
  byteLength?: number;
}): Promise<{ url: string; pathname: string }> {
  if (!ALLOWED.has(args.contentType)) {
    throw new Error(`Unsupported image type: ${args.contentType}`);
  }
  if (args.byteLength != null && args.byteLength > MAX_BYTES) {
    throw new Error(`Image too large (${Math.round(args.byteLength / 1024 / 1024)} MB max ${MAX_BYTES / 1024 / 1024} MB)`);
  }
  const ext = args.fileName.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const pathname = `jobs/${args.jobId}/${safeName}`;

  const blob = await put(pathname, args.body, {
    access: "public",
    contentType: args.contentType,
    addRandomSuffix: false,
  });
  return { url: blob.url, pathname: blob.pathname };
}

export async function deletePhoto(pathnameOrUrl: string): Promise<void> {
  await del(pathnameOrUrl);
}
