import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const allowedTypes = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/svg+xml"]);

export async function saveUploadedImage(file: File) {
  if (!allowedTypes.has(file.type)) {
    throw new Error("Можно загружать только изображения PNG, JPG, WEBP, GIF или SVG.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/gif" ? "gif" : file.type === "image/svg+xml" ? "svg" : "jpg";
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/${filename}`;
}
