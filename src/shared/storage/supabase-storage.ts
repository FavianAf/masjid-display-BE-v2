import { randomUUID } from "node:crypto";
import { env } from "@/config/env";
import { ALLOWED_MEDIA_MIME_TYPES } from "@/config/constants";

export interface UploadResult {
  url: string;
  fileName: string;
  size: number;
}

const isConfigured = Boolean(env.SUPABASE_STORAGE_ENDPOINT && env.SUPABASE_STORAGE_SECRET_KEY);
// Matches v1: SUPABASE_STORAGE_ENDPOINT holds the bare project domain
// (e.g. https://<project-id>.supabase.co); the /storage/v1 REST prefix is
// appended here, not stored in the env var.
const endpoint = env.SUPABASE_STORAGE_ENDPOINT ? `${env.SUPABASE_STORAGE_ENDPOINT.replace(/\/$/, "")}/storage/v1` : "";
const bucket = env.SUPABASE_STORAGE_BUCKET;

function extFromFilename(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx) : ".jpg";
}

function sniffMimeType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  )
    return "image/png";
  if (
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
    return "image/webp";
  return null;
}

/**
 * Uploads a file to Supabase Storage's REST API and returns its public URL.
 * Object key convention (matches v1): `<bucket>/<masjidId>/<uuid><ext>`.
 * Returns null when storage isn't configured (dev/local without Supabase
 * credentials) — callers must handle that case explicitly.
 */
export async function uploadFile(
  data: Uint8Array,
  filename: string,
  contentType: string,
  masjidId: string,
): Promise<UploadResult> {
  if (!isConfigured) {
    throw new Error("storage client not initialized");
  }

  if (data.byteLength > env.SUPABASE_STORAGE_MAX_FILE_SIZE) {
    throw new Error(`file size exceeds maximum limit of ${env.SUPABASE_STORAGE_MAX_FILE_SIZE} bytes`);
  }

  let effectiveType = contentType;
  if (!effectiveType || effectiveType === "application/octet-stream") {
    effectiveType = sniffMimeType(data) ?? effectiveType;
  }
  if (!ALLOWED_MEDIA_MIME_TYPES.has(effectiveType)) {
    throw new Error(`invalid file type: ${effectiveType} (only JPEG, PNG, and WebP images are allowed)`);
  }

  const ext = extFromFilename(filename);
  const objectName = `${masjidId}/${randomUUID()}${ext}`;

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(data)], { type: effectiveType }), filename);

  const res = await fetch(`${endpoint}/object/${bucket}/${objectName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_STORAGE_SECRET_KEY}`,
      apikey: env.SUPABASE_STORAGE_SECRET_KEY!,
    },
    body: form,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`upload failed with status ${res.status}: ${body}`);
  }

  const url = `${endpoint}/object/public/${bucket}/${objectName}`;
  return { url, fileName: objectName, size: data.byteLength };
}

/** Deletes a file from Supabase Storage given its full public URL. No-op if storage isn't configured. */
export async function deleteFile(fileUrl: string): Promise<void> {
  if (!isConfigured || !fileUrl) return;

  const marker = "/object/public/";
  let objectName = fileUrl;
  const idx = fileUrl.indexOf(marker);
  if (idx >= 0) {
    const fullPath = fileUrl.slice(idx + marker.length);
    const slashIdx = fullPath.indexOf("/");
    objectName = slashIdx >= 0 ? fullPath.slice(slashIdx + 1) : fullPath;
  }

  const res = await fetch(`${endpoint}/object/${bucket}/${objectName}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_STORAGE_SECRET_KEY}`,
      apikey: env.SUPABASE_STORAGE_SECRET_KEY!,
    },
  });

  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    throw new Error(`delete failed with status ${res.status}: ${body}`);
  }
}
