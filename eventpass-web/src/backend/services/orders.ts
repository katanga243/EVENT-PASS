import { prisma } from "@/backend/db";
import { sign } from "jsonwebtoken";
import { OrderStatus } from "@prisma/client";
import { MAX_TICKETS_PER_ORDER } from "@/lib/orderLimits";

type OrderItem = { ticketTypeId: string; seatIds: string[] };

export class OrderError extends Error {}

export async function createOrder(
  userId: string,
  holderName: string,
  eventId: string,
  items: OrderItem[]
) {
  const totalQuantity = items.reduce((sum, item) => sum + item.seatIds.length, 0);
  if (totalQuantity === 0) {
    throw new OrderError("Pick at least one seat.");
  }
  if (totalQuantity > MAX_TICKETS_PER_ORDER) {
    throw new OrderError(`You can buy at most ${MAX_TICKETS_PER_ORDER} tickets per order.`);
  }

  return prisma.$transaction(async (tx) => {
    const ticketTypes = await tx.ticketType.findMany({
      where: { id: { in: items.map((i) => i.ticketTypeId) }, eventId },
    });

    if (ticketTypes.length !== items.length) {
      throw new OrderError("One or more ticket types are invalid.");
    }

    const totalCents = items.reduce((sum, item) => {
      const tt = ticketTypes.find((t) => t.id === item.ticketTypeId)!;
      return sum + tt.priceCents * item.seatIds.length;
    }, 0);

    const order = await tx.order.create({
      data: { userId, eventId, totalCents, currency: "eur", status: OrderStatus.PAID },
    });

    for (const item of items) {
      const tt = ticketTypes.find((t) => t.id === item.ticketTypeId)!;

      for (const seatId of item.seatIds) {
        // Atomic guard: flips AVAILABLE -> SOLD only if nobody has claimed this
        // exact seat yet, closing the check-then-act race between concurrent buyers.
        const { count } = await tx.seat.updateMany({
          where: { id: seatId, ticketTypeId: tt.id, status: "AVAILABLE" },
          data: { status: "SOLD" },
        });
        if (count === 0) {
          const seat = await tx.seat.findUnique({ where: { id: seatId }, select: { label: true } });
          throw new OrderError(
            seat ? `Seat ${seat.label} was just taken — please pick another.` : "That seat doesn't exist."
          );
        }

        const qrToken = sign(
          { jti: crypto.randomUUID(), eventId, gate: tt.gate },
          process.env.JWT_SECRET!,
          { expiresIn: "365d" }
        );
        const ticket = await tx.ticket.create({
          data: {
            orderId: order.id,
            eventId,
            ticketTypeId: tt.id,
            holderName,
            gate: tt.gate,
            qrToken,
            status: "VALID",
          },
        });
        await tx.seat.update({ where: { id: seatId }, data: { ticketId: ticket.id } });
      }

      await tx.ticketType.update({
        where: { id: tt.id },
        data: { soldCount: { increment: item.seatIds.length } },
      });
    }

    return order;
  });
}
