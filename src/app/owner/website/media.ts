// Browser-side helpers for the website back office: shrink photos before
// upload, capture a still frame from a clip, and send files straight to
// Supabase Storage (bypassing the 1 MB limit on server action payloads).
import { createClient } from "@/lib/supabase/client";
import { SITE_MEDIA_BUCKET } from "@/content/site-texts";
import type { StoredClip, StoredImage } from "@/content/collections";

const MAX_CLIP_BYTES = 50 * 1024 * 1024;
const CLIP_TYPES: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov" };

function canvasToJpeg(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
}

// Phone cameras produce 5 to 15 MB files; the site only needs a fraction of that.
export async function shrinkImage(file: File, maxEdge: number) {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`เปิดไฟล์ ${file.name} ไม่ได้ ใช้ไฟล์ JPG หรือ PNG (ไฟล์ HEIC จาก iPhone ให้แปลงเป็น JPG ก่อน)`);
  }
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("เบราว์เซอร์นี้ย่อภาพไม่ได้");
  context.fillStyle = "#0a0a0b";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvasToJpeg(canvas);
  if (!blob) throw new Error(`แปลงไฟล์ ${file.name} ไม่สำเร็จ`);
  return { blob, width, height };
}

async function upload(path: string, body: Blob, contentType: string) {
  const { error } = await createClient()
    .storage.from(SITE_MEDIA_BUCKET)
    .upload(path, body, { contentType, cacheControl: "31536000" });
  if (error) throw new Error(error.message);
}

/** Shrinks a photo, uploads it under `folder/` and returns what to store in the row. */
export async function uploadImage(folder: string, file: File, maxEdge = 1600): Promise<StoredImage> {
  const { blob, width, height } = await shrinkImage(file, maxEdge);
  const path = `${folder}/${crypto.randomUUID()}.jpg`;
  await upload(path, blob, "image/jpeg");
  return { path, width, height };
}

// A still from about half a second in, used while the clip loads and as its thumbnail.
async function captureFrame(file: File): Promise<{ blob: Blob; width: number; height: number } | null> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("unsupported"));
      setTimeout(() => reject(new Error("timeout")), 15000);
    });
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
      setTimeout(resolve, 4000);
    });
    if (!video.videoWidth) return null;
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToJpeg(canvas);
    return blob ? { blob, width: canvas.width, height: canvas.height } : null;
  } catch {
    // The browser cannot decode this file (often HEVC from an iPhone): upload it anyway, without a still.
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Uploads a short clip as it is, plus a still frame when the browser can read the video. */
export async function uploadClip(folder: string, file: File): Promise<StoredClip> {
  const extension = CLIP_TYPES[file.type];
  if (!extension) throw new Error("ใช้ไฟล์วิดีโอ MP4 (แนะนำ), WebM หรือ MOV");
  if (file.size > MAX_CLIP_BYTES) {
    throw new Error(`ไฟล์ใหญ่ ${(file.size / 1024 / 1024).toFixed(0)} MB เกินขนาดสูงสุด 50 MB ให้ตัดคลิปให้สั้นลงหรือลดความละเอียด`);
  }

  const frame = await captureFrame(file);
  const id = crypto.randomUUID();
  await upload(`${folder}/${id}.${extension}`, file, file.type);

  let poster: StoredImage | null = null;
  if (frame) {
    const posterPath = `${folder}/${crypto.randomUUID()}.jpg`;
    await upload(posterPath, frame.blob, "image/jpeg");
    poster = { path: posterPath, width: frame.width, height: frame.height };
  }
  return { path: `${folder}/${id}.${extension}`, poster };
}
