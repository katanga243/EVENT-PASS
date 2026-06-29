import { prisma } from "@/backend/db";

export async function getOrganiserFinance(ownerId: string) {
  const events = await prisma.event.findMany({
    where: { ownerId },
    include: { ticketTypes: true },
    orderBy: { startsAt: "asc" },
  });

  const now = new Date();

  const list = events.map((e) => {
    const ticketsSold = e.ticketTypes.reduce((sum, tt) => sum + tt.soldCount, 0);
    const totalCapacity = e.ticketTypes.reduce((sum, tt) => sum + tt.quantity, 0);
    const revenueCents = e.ticketTypes.reduce(
      (sum, tt) => sum + tt.soldCount * tt.priceCents,
      0
    );
    return {
      id: e.id,
      title: e.title,
      venueName: e.venueName,
      city: e.city,
      startsAt: e.startsAt.toISOString(),
      imageUrl: e.imageUrl,
      ticketsSold,
      totalCapacity,
      revenueCents,
      isPast: e.startsAt < now,
    };
  });

  return {
    events: list,
    summary: {
      totalEvents: list.length,
      upcomingEvents: list.filter((e) => !e.isPast).length,
      pastEvents: list.filter((e) => e.isPast).length,
      totalRevenueCents: list.reduce((sum, e) => sum + e.revenueCents, 0),
    },
  };
}

export type CreateEventInput = {
  title: string;
  description: string;
  venueName: string;
  city: "MILANO" | "TORINO";
  startsAt: Date;
  imageUrl: string;
  ticketName: string;
  ticketPriceCents: number;
  ticketQuantity: number;
  ticketGate: string;
};

export async function createOrganiserEvent(ownerId: string, input: CreateEventInput) {
  return prisma.event.create({
    data: {
      title: input.title,
      description: input.description,
      venueName: input.venueName,
      city: input.city,
      startsAt: input.startsAt,
      imageUrl: input.imageUrl,
      ownerId,
      ticketTypes: {
        create: [
          {
            name: input.ticketName,
            priceCents: input.ticketPriceCents,
            quantity: input.ticketQuantity,
            gate: input.ticketGate,
          },
        ],
      },
    },
  });
}

export async function getOrganiserEvents(ownerId: string) {
  const events = await prisma.event.findMany({
    where: { ownerId },
    include: { ticketTypes: true },
    orderBy: { startsAt: "asc" },
  });

  return events.map((e) => {
    const ticketsSold = e.ticketTypes.reduce((sum, tt) => sum + tt.soldCount, 0);
    const totalCapacity = e.ticketTypes.reduce((sum, tt) => sum + tt.quantity, 0);
    const revenueCents = e.ticketTypes.reduce(
      (sum, tt) => sum + tt.soldCount * tt.priceCents,
      0
    );
    return {
      id: e.id,
      title: e.title,
      venueName: e.venueName,
      city: e.city,
      startsAt: e.startsAt,
      imageUrl: e.imageUrl,
      ticketsSold,
      totalCapacity,
      revenueCents,
    };
  });
}

export async function getEventDashboard(eventId: string, ownerId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, ownerId },
    include: { ticketTypes: true },
  });
  if (!event) return null;

  const ticketsSold = event.ticketTypes.reduce((sum, tt) => sum + tt.soldCount, 0);
  const totalCapacity = event.ticketTypes.reduce((sum, tt) => sum + tt.quantity, 0);
  const revenueCents = event.ticketTypes.reduce(
    (sum, tt) => sum + tt.soldCount * tt.priceCents,
    0
  );

  const checkInCount = await prisma.checkIn.count({
    where: { ticket: { eventId } },
  });

  const recentCheckIns = await prisma.checkIn.findMany({
    where: { ticket: { eventId } },
    include: {
      ticket: { select: { holderName: true } },
      scannedBy: { select: { name: true } },
    },
    orderBy: { scannedAt: "desc" },
    take: 20,
  });

  return {
    event: {
      id: event.id,
      title: event.title,
      venueName: event.venueName,
      city: event.city,
      startsAt: event.startsAt,
    },
    ticketsSold,
    totalCapacity,
    revenueCents,
    checkInCount,
    checkInRate: ticketsSold > 0 ? checkInCount / ticketsSold : 0,
    recentCheckIns: recentCheckIns.map((c) => ({
      id: c.id,
      guestName: c.ticket.holderName,
      gate: c.gate,
      scannedBy: c.scannedBy.name,
      scannedAt: c.scannedAt,
    })),
  };
}
