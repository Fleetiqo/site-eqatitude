import fs from "node:fs/promises";
import { contentTypeFor, uploadPath } from "@/server/services/storage";

/** Serves photos uploaded from the admin console (stored outside /public, on the data disk). */
export async function GET(_request: Request, { params }: RouteContext<"/uploads/site/[file]">) {
  const { file } = await params;
  const filePath = uploadPath("site", file);
  if (!filePath) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(filePath);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": contentTypeFor(file),
        // File names are unique (timestamp + random), so they can be cached for a long time.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
