import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  revalidatePath("/");
  revalidatePath("/admin/featured");
  revalidateTag("featured");
  return NextResponse.json({ ok: true });
}
