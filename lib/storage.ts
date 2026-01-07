import path from "node:path";
import fs from "node:fs/promises";
import crypto from "node:crypto";
import { env } from "@/lib/env";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB MVP

function safeExt(mime: string): string | null {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "application/pdf") return "pdf";
  return null;
}

export async function saveReceipt(file: File, householdId: string): Promise<string> {
  if (!env.FILE_STORAGE_DIR) {
    throw new Error("Storage disabled (no FILE_STORAGE_DIR).");
  }
  const ext = safeExt(file.type);
  if (!ext) throw new Error("Unsupported file type");
  if (file.size > MAX_BYTES) throw new Error("File too large");

  const dir = path.join(env.FILE_STORAGE_DIR, householdId);
  await fs.mkdir(dir, { recursive: true });

  const name = crypto.randomUUID();
  const filename = `${name}.${ext}`;
  const abs = path.join(dir, filename);

  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(abs, buf);

  return `storage/${householdId}/${filename}`;
}
