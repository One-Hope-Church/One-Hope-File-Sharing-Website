import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { uploadImageAssetWithUrl } from "@/lib/sanity";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("image");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Please select an image file" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Image must be JPEG, PNG, or WebP" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Image must be under ${MAX_SIZE_MB} MB` }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadImageAssetWithUrl(buffer, file.name, file.type);
  if (!uploaded) {
    return NextResponse.json({ error: "Failed to upload thumbnail" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, thumbnailUrl: uploaded.url });
}

