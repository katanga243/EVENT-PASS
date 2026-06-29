import { prisma } from "@/backend/db";

export async function getUserTickets(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId, status: "PAID", totalCents: { gt: 0 } },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          venueName: true,
          city: true,
          startsAt: true,
          imageUrl: true,
        },
      },
      tickets: {
        include: { ticketType: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.flatMap((o) =>
    o.tickets.map((t) => ({ ...t, event: o.event, orderId: o.id }))
  );
}

export function getTicketById(ticketId: string) {
  return prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          venueName: true,
          city: true,
          startsAt: true,
          imageUrl: true,
        },
      },
      order: { select: { id: true, userId: true } },
      ticketType: { select: { name: true } },
    },
  });
}
