import { prisma } from "@/backend/db";
import { City } from "@prisma/client";

export function getEvents(city?: City, q?: string) {
  const search = q?.trim();
  return prisma.event.findMany({
    where: {
      ...(city ? { city } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { venueName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { ticketTypes: { select: { priceCents: true } } },
    orderBy: { startsAt: "asc" },
  });
}

export function getEventById(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      ticketTypes: {
        orderBy: { priceCents: "asc" },
        include: {
          seats: {
            select: { id: true, label: true, status: true },
            orderBy: { label: "asc" },
          },
        },
      },
    },
  });
}
