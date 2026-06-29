import { NextRequest, NextResponse } from "next/server";
import { getMobileUser } from "@/backend/mobileAuth";
import { listGuests, addGuest, OrderError } from "@/backend/services/mobileEvents";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const user = getMobileUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const guests = await listGuests(eventId, user.id);
  if (guests === null) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ guests });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const user = getMobileUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  let body: { name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Guest name is required" }, { status: 400 });
  }

  try {
    const guest = await addGuest(eventId, user.id, body.name.trim());
    if (!guest) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ guest });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
