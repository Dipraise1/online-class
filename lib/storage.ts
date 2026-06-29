import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Saves an uploaded file. Uses Vercel Blob in production (or whenever a token
// is present); falls back to the local /public/uploads folder for dev.
export async function saveFile(
  file: File
): Promise<{ url: string; fileName: string; size: number }> {
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(safeName, file, { access: "public" });
    return { url: blob.url, fileName: file.name, size: file.size };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), bytes);
  return { url: `/uploads/${safeName}`, fileName: file.name, size: file.size };
}
