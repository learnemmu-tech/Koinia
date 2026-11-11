import { NextResponse } from "next/server";

import { readObject } from "@/lib/storage/s3";
import { publicObjectIsReadable } from "@/lib/storage/stored-objects";

type RouteContext = { params: Promise<{ key: string[] }> };

export async function GET(_request: Request, context: RouteContext) {
  const { key } = await context.params;
  const objectKey = key.map((part) => decodeURIComponent(part)).join("/");
  if (
    !objectKey ||
    objectKey.includes("..") ||
    objectKey.startsWith("/") ||
    objectKey.startsWith("books/protected/")
  ) {
    return new NextResponse(null, { status: 404 });
  }
  if (!(await publicObjectIsReadable(objectKey))) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const object = await readObject(objectKey);
    if (!object.Body) return new NextResponse(null, { status: 404 });
    const bytes = await object.Body.transformToByteArray();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": object.ContentType || "application/octet-stream",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
