import { NextRequest, NextResponse } from "next/server";
import { getMobileUser } from "@/backend/mobileAuth";
import { checkInByQrToken } from "@/backend/services/checkin";

export async function POST(req: NextRequest) {
  const user = getMobileUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { qrToken?: string; eventId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.qrToken) {
    return NextResponse.json({ error: "qrToken is required" }, { status: 400 });
  }

  const result = await checkInByQrToken(body.qrToken, user.id, body.eventId);
  return NextResponse.json(result);
}
