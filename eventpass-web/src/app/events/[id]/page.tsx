import { getEventById } from "@/backend/services/events";
import { notFound } from "next/navigation";
import Nav from "@/frontend/Nav";
import Footer from "@/frontend/Footer";
import EventDetailClient from "@/frontend/EventDetailClient";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await getEventById(id);

  if (!event) notFound();

  const serialized = {
    id: event.id,
    title: event.title,
    description: event.description,
    venueName: event.venueName,
    city: event.city,
    startsAt: event.startsAt.toISOString(),
    imageUrl: event.imageUrl,
    ticketTypes: event.ticketTypes.map((t) => ({
      id: t.id,
      name: t.name,
      priceCents: t.priceCents,
      gate: t.gate,
      quantity: t.quantity,
      soldCount: t.soldCount,
      seats: t.seats.map((s) => ({ id: s.id, label: s.label, status: s.status })),
    })),
  };

  return (
    <>
      <Nav />
      <main className="flex-1" style={{ background: "#f4f6fb" }}>
        <EventDetailClient event={serialized} />
      </main>
      <Footer />
    </>
  );
}
