import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createOrder, OrderError } from "@/backend/services/orders";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { eventId: string; items: Array<{ ticketTypeId: string; seatIds: string[] }> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { eventId, items } = body;
  if (
    !eventId ||
    !Array.isArray(items) ||
    items.length === 0 ||
    items.some((i) => !i.ticketTypeId || !Array.isArray(i.seatIds) || i.seatIds.length === 0)
  ) {
    return NextResponse.json({ error: "eventId and at least one selected seat are required" }, { status: 400 });
  }

  try {
    await createOrder(
      session.user.id,
      session.user.name ?? "Guest",
      eventId,
      items
    );
    return NextResponse.json({ url: "/checkout/success" });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
