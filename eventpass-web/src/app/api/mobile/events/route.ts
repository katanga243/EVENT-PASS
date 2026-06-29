import { NextRequest, NextResponse } from "next/server";
import { getMobileUser } from "@/backend/mobileAuth";
import { listMobileEvents, createMobileEvent } from "@/backend/services/mobileEvents";

export async function GET(req: NextRequest) {
  const user = getMobileUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await listMobileEvents(user.id);
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const user = getMobileUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name?: string; date?: string; location?: string; capacity?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, date, location, capacity } = body;
  if (!name || !capacity || capacity < 1) {
    return NextResponse.json({ error: "Name and a valid capacity are required" }, { status: 400 });
  }

  const event = await createMobileEvent(user.id, {
    name,
    date: date ?? "",
    location: location ?? "",
    capacity,
  });

  return NextResponse.json({ event });
}
