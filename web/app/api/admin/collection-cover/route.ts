import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getCollectionBySlug,
  getCollectionById,
  uploadImageAsset,
  setCollectionHeroImage,
} from "@/lib/sanity";

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
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const collectionSlug = formData.get("collectionSlug");
  const collectionIdParam = formData.get("collectionId");
  const file = formData.get("image");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Please select an image file" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Image must be JPEG, PNG, or WebP" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `Image must be under ${MAX_SIZE_MB} MB` },
      { status: 400 }
    );
  }

  const slug = typeof collectionSlug === "string" ? collectionSlug.trim() : "";
  const idParam = typeof collectionIdParam === "string" ? collectionIdParam.trim() : "";
  let collectionId: string | null = null;

  if (idParam) {
    const col = await getCollectionById(idParam);
    collectionId = col ? String(col._id) : null;
  }
  if (!collectionId && slug) {
    const col = await getCollectionBySlug(slug);
    collectionId = col ? String(col._id) : null;
  }

  if (!collectionId) {
    return NextResponse.json(
      { error: "Collection not found. Use a valid collection slug or ID." },
      { status: 404 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const assetId = await uploadImageAsset(buffer, file.name, file.type);
  if (!assetId) {
    return NextResponse.json(
      { error: "Failed to upload image (check SANITY_API_TOKEN)" },
      { status: 500 }
    );
  }

  const ok = await setCollectionHeroImage(collectionId, assetId);
  if (!ok) {
    return NextResponse.json(
      { error: "Failed to set collection cover" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
