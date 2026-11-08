"use client";
import { useCallback, useState } from "react";
import type { ImageLoaderProps } from "next/image";
import { adminApi } from "./admin";
import type { ApiError } from "./api";

/* ---------------------------------- types ---------------------------------- */

export interface MediaAsset {
  id: string;
  publicId: string;
  url: string;
  label: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  createdAt: string;
  usedBy: { type: "vehicle_type"; id: string; name: string }[];
}

export interface MediaRules {
  enabled: boolean;
  cloudName: string | null;
  maxBytes: number;
  formats: string[];
}

export interface MediaList {
  items: MediaAsset[];
  page: number;
  pageSize: number;
  total: number;
  storage: MediaRules;
}

interface SignedUpload {
  uploadUrl: string;
  fields: Record<string, string>;
  rules: MediaRules;
}

/* ----------------------------------- api ----------------------------------- */

export const mediaApi = {
  rename: (id: string, label: string) => adminApi.patch<MediaAsset>(`/media/${id}`, { label }),
  remove: (id: string) => adminApi.del<{ removed: boolean }>(`/media/${id}`),
};

const ACCEPT_MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };
export const acceptAttr = (formats: readonly string[]) => [...new Set(formats.map((f) => ACCEPT_MIME[f]).filter(Boolean))].join(",");

/** Checks a file before uploading (the API re-checks with Cloudinary afterwards). */
export function checkFile(file: File, rules: Pick<MediaRules, "maxBytes" | "formats">): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const typeOk = rules.formats.includes(ext) || Object.entries(ACCEPT_MIME).some(([f, mime]) => rules.formats.includes(f) && file.type === mime);
  if (!typeOk) return `Only ${rules.formats.filter((f) => f !== "jpeg").join(", ").toUpperCase()} images are allowed.`;
  if (file.size > rules.maxBytes) return `This file is ${formatBytes(file.size)}; the limit is ${formatBytes(rules.maxBytes)}.`;
  return null;
}

/** Browser → Cloudinary upload with progress (fetch has no upload progress). */
function sendToCloudinary(file: File, signed: SignedUpload, onProgress: (pct: number) => void): Promise<{ public_id: string }> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    for (const [k, v] of Object.entries(signed.fields)) form.append(k, v);
    form.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", signed.uploadUrl);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let body: { public_id?: string; error?: { message?: string } } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON error page */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.public_id) resolve({ public_id: body.public_id });
      else reject(new Error(body.error?.message ?? `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error while uploading. Check your connection and try again."));
    xhr.send(form);
  });
}

/** Sign → upload straight to Cloudinary → register with the API. */
export async function uploadImage(file: File, onProgress: (pct: number) => void = () => undefined): Promise<MediaAsset> {
  const signed = await adminApi.post<SignedUpload>("/media/sign");
  const problem = checkFile(file, signed.rules);
  if (problem) throw new Error(problem);
  const { public_id } = await sendToCloudinary(file, signed, onProgress);
  return adminApi.post<MediaAsset>("/media", { publicId: public_id, originalName: file.name });
}

export interface UploadItem {
  key: string;
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
  asset?: MediaAsset;
}

/**
 * Upload queue shared by the gallery page and the floating picker. Files
 * upload in parallel; each reports progress and its own error.
 */
export function useMediaUpload(rules: Pick<MediaRules, "maxBytes" | "formats"> | null, onUploaded?: (assets: MediaAsset[]) => void) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const patch = (key: string, p: Partial<UploadItem>) => setItems((list) => list.map((i) => (i.key === key ? { ...i, ...p } : i)));

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const batch = [...files].map((file, i) => ({ file, key: `${Date.now()}-${i}-${file.name}` }));
      setItems((list) => [
        ...batch.map(({ file, key }) => {
          const problem = rules ? checkFile(file, rules) : null;
          return { key, name: file.name, progress: 0, status: problem ? "error" : "uploading", error: problem ?? undefined } as UploadItem;
        }),
        ...list.filter((i) => i.status !== "done"),
      ]);
      const results = await Promise.all(
        batch.map(async ({ file, key }) => {
          if (rules && checkFile(file, rules)) return null;
          try {
            const asset = await uploadImage(file, (progress) => patch(key, { progress }));
            patch(key, { status: "done", progress: 100, asset });
            return asset;
          } catch (e) {
            patch(key, { status: "error", error: (e as ApiError | Error).message });
            return null;
          }
        }),
      );
      const done = results.filter((a): a is MediaAsset => !!a);
      if (done.length) onUploaded?.(done);
      return done;
    },
    [rules, onUploaded],
  );

  const dismiss = (key: string) => setItems((list) => list.filter((i) => i.key !== key));
  return { items, upload, dismiss, busy: items.some((i) => i.status === "uploading") };
}

/* -------------------------------- delivery --------------------------------- */

export const isCloudinaryUrl = (src: string) => /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(src);

/**
 * next/image loader for Cloudinary URLs: Cloudinary resizes and picks the best
 * format (WebP/AVIF), so pages download a small image instead of the original.
 */
export function cloudinaryLoader({ src, width, quality }: ImageLoaderProps) {
  return src.replace("/image/upload/", `/image/upload/f_auto,q_${quality ?? "auto"},c_limit,w_${width}/`);
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
