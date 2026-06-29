import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserTickets } from "@/backend/services/tickets";
import MyTicketsClient from "@/frontend/MyTicketsClient";

export const metadata = { title: "My Tickets — EventPass" };

export default async function MyTicketsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/account/tickets");

  const allTickets = await getUserTickets(session.user.id);
  const tickets = allTickets.map((t) => ({
    id: t.id,
    gate: t.gate,
    status: t.status,
    ticketType: { name: t.ticketType.name },
    event: {
      title: t.event.title,
      venueName: t.event.venueName,
      city: t.event.city,
      startsAt: t.event.startsAt.toISOString(),
      imageUrl: t.event.imageUrl,
    },
  }));

  return (
    <main className="min-h-screen bg-[#f4f6fb] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1
          className="text-3xl font-bold text-[#0a0a0f] mb-8"
          style={{ fontFamily: "var(--font-space)" }}
        >
          My Tickets
        </h1>

        <MyTicketsClient tickets={tickets} />
      </div>
    </main>
  );
}
