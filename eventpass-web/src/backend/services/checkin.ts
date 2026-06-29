import { prisma } from "@/backend/db";
import { verify } from "jsonwebtoken";

type CheckInResult =
  | { status: "invalid" }
  | { status: "wrong_event" }
  | { status: "duplicate"; guest: { name: string } }
  | { status: "success"; guest: { name: string }; gate: string; eventId: string };

export async function checkInByQrToken(
  qrToken: string,
  scannedByUserId: string,
  expectedEventId?: string
): Promise<CheckInResult> {
  try {
    verify(qrToken, process.env.JWT_SECRET!);
  } catch {
    return { status: "invalid" };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { qrToken },
    include: { checkIn: true },
  });

  if (!ticket) return { status: "invalid" };
  if (expectedEventId && ticket.eventId !== expectedEventId) {
    return { status: "wrong_event" };
  }

  if (ticket.status === "CHECKED_IN" || ticket.checkIn) {
    return { status: "duplicate", guest: { name: ticket.holderName } };
  }

  try {
    // Atomic guard: the unique constraint on CheckIn.ticketId rejects a
    // second concurrent scan instead of racing past the check above.
    await prisma.$transaction([
      prisma.checkIn.create({
        data: { ticketId: ticket.id, gate: ticket.gate, scannedByUserId },
      }),
      prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: "CHECKED_IN" },
      }),
    ]);
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "P2002") {
      return { status: "duplicate", guest: { name: ticket.holderName } };
    }
    throw err;
  }

  return {
    status: "success",
    guest: { name: ticket.holderName },
    gate: ticket.gate,
    eventId: ticket.eventId,
  };
}
