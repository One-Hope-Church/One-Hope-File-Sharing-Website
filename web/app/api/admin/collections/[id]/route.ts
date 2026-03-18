import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { updateCollectionDescription } from "@/lib/sanity";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const description =
    typeof (body as Record<string, unknown>).description === "string"
      ? String((body as Record<string, unknown>).description)
      : null;

  if (description === null) {
    return NextResponse.json({ error: "description (string) required" }, { status: 400 });
  }

  const ok = await updateCollectionDescription(id, description);
  if (!ok) {
    return NextResponse.json({ error: "Failed to update description" }, { status: 500 });
  }

  // Ensure any server-rendered admin pages pick up the change.
  revalidatePath("/admin/collection-manage");
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}

