import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { getTicketById } from "@/backend/services/tickets";
import TicketView from "./TicketView";

export const metadata = { title: "Your Ticket — EventPass" };

export default async function TicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/auth/signin?callbackUrl=/account/tickets/${ticketId}`);

  const ticket = await getTicketById(ticketId);

  if (!ticket || ticket.order.userId !== session.user.id) notFound();

  const qrDataUrl = await QRCode.toDataURL(ticket.qrToken, {
    width: 280,
    margin: 2,
    color: { dark: "#0a0a0f", light: "#ffffff" },
  });

  const dt = new Date(ticket.event.startsAt);
  const dateStr = dt.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = dt.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="min-h-screen bg-[#f4f6fb] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <TicketView
          ticket={{
            id: ticket.id,
            holderName: ticket.holderName,
            gate: ticket.gate,
            status: ticket.status,
            orderId: ticket.order.id,
            ticketTypeName: ticket.ticketType.name,
            event: {
              title: ticket.event.title,
              venueName: ticket.event.venueName,
              city: ticket.event.city,
              imageUrl: ticket.event.imageUrl,
              dateStr,
              timeStr,
            },
          }}
          qrDataUrl={qrDataUrl}
        />
      </div>
    </main>
  );
}
