import { prisma } from "@/backend/db";
import { createOrder, OrderError } from "@/backend/services/orders";

export { OrderError };

const PLACEHOLDER_IMAGE = "/events/placeholder.jpg";

function formatDisplayDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function parseEventDate(input: string) {
  if (!input) return new Date();
  const parsed = new Date(input);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function listMobileEvents(ownerId: string) {
  const events = await prisma.event.findMany({
    where: { ownerId },
    include: { ticketTypes: true },
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    events.map(async (e) => {
      const capacity = e.ticketTypes.reduce((sum, tt) => sum + tt.quantity, 0);
      const checkedIn = await prisma.checkIn.count({
        where: { ticket: { eventId: e.id } },
      });
      return {
        id: e.id,
        name: e.title,
        date: formatDisplayDate(e.startsAt),
        location: e.venueName,
        capacity,
        checkedIn,
        total: e.ticketTypes.reduce((sum, tt) => sum + tt.soldCount, 0),
      };
    })
  );
}

export async function createMobileEvent(
  ownerId: string,
  data: { name: string; date: string; location: string; capacity: number }
) {
  const event = await prisma.$transaction(async (tx) => {
    const ev = await tx.event.create({
      data: {
        title: data.name,
        description: "",
        venueName: data.location || "TBA",
        city: "MILANO",
        startsAt: parseEventDate(data.date),
        imageUrl: PLACEHOLDER_IMAGE,
        ownerId,
      },
    });
    const tier = await tx.ticketType.create({
      data: {
        eventId: ev.id,
        name: "General",
        priceCents: 0,
        gate: "A",
        quantity: data.capacity,
      },
    });
    await tx.seat.createMany({
      data: Array.from({ length: data.capacity }, (_, i) => ({
        ticketTypeId: tier.id,
        eventId: ev.id,
        label: `A-${i + 1}`,
      })),
    });
    return ev;
  });

  return { id: event.id, name: event.title };
}

export async function deleteMobileEvent(eventId: string, ownerId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, ownerId } });
  if (!event) return false;
  await prisma.event.delete({ where: { id: eventId } });
  return true;
}

export async function listGuests(eventId: string, ownerId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, ownerId } });
  if (!event) return null;

  const tickets = await prisma.ticket.findMany({
    where: { eventId },
    include: { checkIn: true },
    orderBy: { createdAt: "asc" },
  });

  return tickets.map((t) => ({
    id: t.id,
    eventId: t.eventId,
    name: t.holderName,
    ticketCode: t.id.slice(-8).toUpperCase(),
    qrToken: t.qrToken,
    checkedIn: t.status === "CHECKED_IN",
    checkInTime: t.checkIn?.scannedAt.toISOString() ?? null,
  }));
}

export async function addGuest(eventId: string, ownerId: string, name: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, ownerId },
    include: { ticketTypes: true },
  });
  if (!event) return null;

  const ticketType = event.ticketTypes[0];
  if (!ticketType) throw new OrderError("This event has no ticket type set up.");

  const seat = await prisma.seat.findFirst({
    where: { ticketTypeId: ticketType.id, status: "AVAILABLE" },
  });
  if (!seat) throw new OrderError("This event has no spots left.");

  const order = await createOrder(ownerId, name, eventId, [
    { ticketTypeId: ticketType.id, seatIds: [seat.id] },
  ]);

  const ticket = await prisma.ticket.findFirstOrThrow({
    where: { orderId: order.id },
  });

  return {
    id: ticket.id,
    eventId: ticket.eventId,
    name: ticket.holderName,
    ticketCode: ticket.id.slice(-8).toUpperCase(),
    qrToken: ticket.qrToken,
    checkedIn: false,
    checkInTime: null,
  };
}
