"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Ticket = {
  id: string;
  gate: string;
  status: string;
  ticketType: { name: string };
  event: {
    title: string;
    venueName: string;
    city: string;
    startsAt: string;
    imageUrl: string;
  };
};

export default function MyTicketsClient({ tickets }: { tickets: Ticket[] }) {
  const [tab, setTab] = useState<"active" | "past">("active");

  const active = tickets.filter((t) => t.status !== "CHECKED_IN");
  const past = tickets.filter((t) => t.status === "CHECKED_IN");
  const shown = tab === "active" ? active : past;

  return (
    <div className="flex flex-col gap-6">
      <div
        className="inline-flex rounded-full p-[3px] border self-start"
        style={{ background: "#f4f6fb", borderColor: "#e6e9f1" }}
      >
        {([
          { key: "active", label: `Active (${active.length})` },
          { key: "past", label: `Past tickets (${past.length})` },
        ] as const).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className="text-[13px] font-bold px-[16px] py-[7px] rounded-full transition-colors"
            style={{
              color: tab === t.key ? "#1452f0" : "#3a4254",
              background: tab === t.key ? "#fff" : "transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#e6e9f1]">
          <p className="text-[#0a0a0f]/50 mb-4">
            {tab === "active" ? "No active tickets." : "No past tickets yet."}
          </p>
          {tab === "active" && (
            <Link
              href="/"
              className="inline-block bg-[#1452f0] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0e3fcf]"
            >
              Browse Events
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {shown.map((ticket) => {
            const dt = new Date(ticket.event.startsAt);
            const dateStr = dt.toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const timeStr = dt.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <Link
                key={ticket.id}
                href={`/account/tickets/${ticket.id}`}
                className="flex items-center gap-4 bg-white rounded-2xl border border-[#e6e9f1] p-4 hover:shadow-md transition-shadow"
                style={tab === "past" ? { opacity: 0.7 } : undefined}
              >
                <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                  <Image
                    src={ticket.event.imageUrl}
                    alt={ticket.event.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold text-[#0a0a0f] truncate"
                    style={{ fontFamily: "var(--font-space)" }}
                  >
                    {ticket.event.title}
                  </p>
                  <p className="text-sm text-[#0a0a0f]/60 mt-0.5">
                    {ticket.event.venueName} · {ticket.event.city}
                  </p>
                  <p className="text-sm text-[#0a0a0f]/60">
                    {dateStr} at {timeStr}
                  </p>
                  <p className="text-xs mt-1 font-medium" style={{ color: tab === "past" ? "#059669" : "#1452f0" }}>
                    {tab === "past" ? "Checked in · " : ""}{ticket.ticketType.name} · Gate {ticket.gate}
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
  );
}
