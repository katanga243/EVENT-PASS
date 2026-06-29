import { NextRequest, NextResponse } from "next/server";
import { getMobileUser } from "@/backend/mobileAuth";
import { deleteMobileEvent } from "@/backend/services/mobileEvents";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const user = getMobileUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const deleted = await deleteMobileEvent(eventId, user.id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
