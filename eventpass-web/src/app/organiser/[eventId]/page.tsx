import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getEventDashboard } from "@/backend/services/organiser";

export const metadata = { title: "Event Dashboard — EventPass" };

function formatEUR(cents: number) {
  return (cents / 100).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  });
}

export default async function OrganiserEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/auth/signin?callbackUrl=/organiser/${eventId}`);
  if ((session.user as { role: string }).role !== "ORGANISER") redirect("/?notice=organiser-only");

  const dashboard = await getEventDashboard(eventId, session.user.id);
  if (!dashboard) notFound();

  const { event, ticketsSold, totalCapacity, revenueCents, checkInCount, checkInRate, recentCheckIns } =
    dashboard;

  const dt = new Date(event.startsAt);
  const dateStr = dt.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const stats = [
    { label: "Tickets sold", value: `${ticketsSold} / ${totalCapacity}` },
    { label: "Revenue", value: formatEUR(revenueCents) },
    { label: "Checked in", value: `${checkInCount}` },
    { label: "Check-in rate", value: `${Math.round(checkInRate * 100)}%` },
  ];

  return (
    <main className="min-h-screen bg-[#f4f6fb] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/organiser"
          className="text-[#1452f0] text-sm font-medium flex items-center gap-1 hover:underline mb-6"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
              clipRule="evenodd"
            />
          </svg>
          My Events
        </Link>

        <h1
          className="text-3xl font-bold text-[#0a0a0f] mb-1"
          style={{ fontFamily: "var(--font-space)" }}
        >
          {event.title}
        </h1>
        <p className="text-[#0a0a0f]/60 mb-8">
          {event.venueName} · {event.city === "MILANO" ? "Milano" : "Torino"} · {dateStr} ·{" "}
          {timeStr}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-[#e6e9f1] p-5"
            >
              <p className="text-[11px] font-semibold text-[#0a0a0f]/40 uppercase tracking-widest mb-1">
                {s.label}
              </p>
              <p
                className="text-2xl font-bold text-[#0a0a0f]"
                style={{ fontFamily: "var(--font-space)" }}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <h2
          className="text-xl font-bold text-[#0a0a0f] mb-4"
          style={{ fontFamily: "var(--font-space)" }}
        >
          Recent Check-ins
        </h2>

        {recentCheckIns.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-[#e6e9f1]">
            <p className="text-[#0a0a0f]/50">No check-ins yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#e6e9f1] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e6e9f1] text-left text-[#0a0a0f]/40 text-xs font-semibold uppercase tracking-widest">
                  <th className="px-5 py-3">Guest</th>
                  <th className="px-5 py-3">Gate</th>
                  <th className="px-5 py-3">Scanned by</th>
                  <th className="px-5 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentCheckIns.map((c) => (
                  <tr key={c.id} className="border-b border-[#e6e9f1] last:border-0">
                    <td className="px-5 py-3 font-semibold text-[#0a0a0f]">{c.guestName}</td>
                    <td className="px-5 py-3 text-[#1452f0] font-medium">Gate {c.gate}</td>
                    <td className="px-5 py-3 text-[#0a0a0f]/70">{c.scannedBy}</td>
                    <td className="px-5 py-3 text-[#0a0a0f]/50">
                      {new Date(c.scannedAt).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
