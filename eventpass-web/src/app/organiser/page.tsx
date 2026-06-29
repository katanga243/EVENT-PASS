import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { getOrganiserEvents } from "@/backend/services/organiser";

export const metadata = { title: "Organiser Dashboard — EventPass" };

function formatEUR(cents: number) {
  return (cents / 100).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  });
}

export default async function OrganiserPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/organiser");
  if ((session.user as { role: string }).role !== "ORGANISER") redirect("/?notice=organiser-only");

  const events = await getOrganiserEvents(session.user.id);

  return (
    <main className="min-h-screen bg-[#f4f6fb] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1
            className="text-3xl font-bold text-[#0a0a0f]"
            style={{ fontFamily: "var(--font-space)" }}
          >
            My Events
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href="/organiser/finance"
              className="font-bold text-[14px] px-5 py-[10px] rounded-[12px]"
              style={{ background: "#e8efff", color: "#1452f0" }}
            >
              Finance
            </Link>
            <Link
              href="/organiser/new"
              className="font-bold text-[14px] px-5 py-[10px] rounded-[12px] text-white transition-opacity hover:opacity-90"
              style={{ background: "#1452f0", boxShadow: "0 8px 20px rgba(20,82,240,.28)" }}
            >
              + Create event
            </Link>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#e6e9f1]">
            <p className="text-[#0a0a0f]/50">No events yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((ev) => {
              const dt = new Date(ev.startsAt);
              const dateStr = dt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const pct =
                ev.totalCapacity > 0
                  ? Math.round((ev.ticketsSold / ev.totalCapacity) * 100)
                  : 0;

              return (
                <Link
                  key={ev.id}
                  href={`/organiser/${ev.id}`}
                  className="flex items-center gap-4 bg-white rounded-2xl border border-[#e6e9f1] p-4 hover:shadow-md transition-shadow"
                >
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <Image src={ev.imageUrl} alt={ev.title} fill className="object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="font-bold text-[#0a0a0f] truncate"
                      style={{ fontFamily: "var(--font-space)" }}
                    >
                      {ev.title}
                    </p>
                    <p className="text-sm text-[#0a0a0f]/60 mt-0.5">
                      {ev.venueName} · {ev.city === "MILANO" ? "Milano" : "Torino"} · {dateStr}
                    </p>
                    <p className="text-sm text-[#1452f0] font-medium mt-1">
                      {ev.ticketsSold} / {ev.totalCapacity} sold ({pct}%) ·{" "}
                      {formatEUR(ev.revenueCents)} revenue
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-[#0a0a0f]/30">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
