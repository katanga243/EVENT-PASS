"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import VenueMap from "./VenueMap";
import { MAX_TICKETS_PER_ORDER } from "@/lib/orderLimits";

type Seat = {
  id: string;
  label: string;
  status: "AVAILABLE" | "SOLD";
};

type TicketType = {
  id: string;
  name: string;
  priceCents: number;
  gate: string;
  quantity: number;
  soldCount: number;
  seats: Seat[];
};

type EventData = {
  id: string;
  title: string;
  description: string;
  venueName: string;
  city: "MILANO" | "TORINO";
  startsAt: string;
  imageUrl: string;
  ticketTypes: TicketType[];
};

export default function EventDetailClient({ event }: { event: EventData }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, string[]>>(
    Object.fromEntries(event.ticketTypes.map((t) => [t.id, []]))
  );
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const totalQty = Object.values(selected).reduce((sum, ids) => sum + ids.length, 0);
  const totalCents = event.ticketTypes.reduce(
    (sum, t) => sum + t.priceCents * (selected[t.id]?.length ?? 0),
    0
  );

  function toggleSeat(tierId: string, seatId: string) {
    setSelected((prev) => {
      const current = prev[tierId] ?? [];
      if (current.includes(seatId)) {
        return { ...prev, [tierId]: current.filter((id) => id !== seatId) };
      }
      const total = Object.values(prev).reduce((sum, ids) => sum + ids.length, 0);
      if (total >= MAX_TICKETS_PER_ORDER) return prev;
      return { ...prev, [tierId]: [...current, seatId] };
    });
  }

  function addAnySeat(tierId: string) {
    setSelected((prev) => {
      const total = Object.values(prev).reduce((sum, ids) => sum + ids.length, 0);
      if (total >= MAX_TICKETS_PER_ORDER) return prev;
      const current = prev[tierId] ?? [];
      const tier = event.ticketTypes.find((t) => t.id === tierId)!;
      const next = tier.seats.find((s) => s.status === "AVAILABLE" && !current.includes(s.id));
      if (!next) return prev;
      return { ...prev, [tierId]: [...current, next.id] };
    });
  }

  function removeLastSeat(tierId: string) {
    setSelected((prev) => {
      const current = prev[tierId] ?? [];
      if (current.length === 0) return prev;
      return { ...prev, [tierId]: current.slice(0, -1) };
    });
  }

  async function handleBuy() {
    if (totalCents === 0 || checkingOut) return;
    setCheckingOut(true);
    setCheckoutError(null);

    const items = event.ticketTypes
      .filter((t) => (selected[t.id]?.length ?? 0) > 0)
      .map((t) => ({ ticketTypeId: t.id, seatIds: selected[t.id] }));

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: event.id, items }),
    });

    if (res.status === 401) {
      window.location.href = `/auth/signin?callbackUrl=/events/${event.id}`;
      return;
    }

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setCheckoutError(data.error ?? "Something went wrong. Please try again.");
      setCheckingOut(false);
      router.refresh();
    }
  }

  const date = new Date(event.startsAt);
  const dateStr = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  const timeStr = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  const cityLabel = event.city === "MILANO" ? "Milano" : "Torino";
  const cityColor = event.city === "MILANO" ? "#1452f0" : "#0a0a0f";

  return (
    <div className="max-w-[1180px] mx-auto px-4 sm:px-6 pb-16">
      <nav className="py-5 text-[13px] font-semibold flex items-center gap-2" style={{ color: "#838ca0" }}>
        <Link href="/" className="hover:text-[#1452f0] transition-colors">
          Events
        </Link>
        <span>›</span>
        <span style={{ color: "#0a0a0f" }}>{event.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-7 items-start">
        <div className="min-w-0">
          <div className="relative aspect-[16/7] rounded-[22px] overflow-hidden mb-6">
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 780px"
            />
            <div className="absolute top-4 left-4">
              <span
                className="text-[12px] font-bold px-[13px] py-[6px] rounded-full text-white"
                style={{ background: cityColor }}
              >
                {cityLabel}
              </span>
            </div>
          </div>

          <div
            className="bg-white rounded-[22px] p-7"
            style={{ border: "1px solid #e6e9f1", boxShadow: "0 8px 30px rgba(12,24,56,.07)" }}
          >
            <div className="flex flex-wrap gap-5 mb-5 text-[14px] font-semibold" style={{ color: "#3a4254" }}>
              <span className="flex items-center gap-[7px]">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M3 9h18M8 3v4M16 3v4" />
                </svg>
                {dateStr} · {timeStr}
              </span>
              <span className="flex items-center gap-[7px]">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                {event.venueName}, {cityLabel}
              </span>
            </div>

            <h1
              className="font-bold mb-5 leading-[1.1]"
              style={{
                fontFamily: "Space Grotesk, system-ui",
                fontSize: "clamp(26px,4vw,42px)",
                letterSpacing: "-0.03em",
              }}
            >
              {event.title}
            </h1>

            <p className="text-[16px] leading-[1.75]" style={{ color: "#3a4254" }}>
              {event.description}
            </p>
          </div>
        </div>

        <div className="lg:sticky lg:top-[88px]">
          <div
            className="bg-white rounded-[22px] p-7"
            style={{ border: "1px solid #e6e9f1", boxShadow: "0 8px 30px rgba(12,24,56,.10)" }}
          >
            <h3 className="font-bold text-[19px] mb-[3px]">Your tickets</h3>
            <p className="text-[12.5px] mb-5" style={{ color: "#838ca0" }}>
              Use + to grab any seat, or pick exact ones on the map below
            </p>

            <div style={{ borderTop: "1px solid #e6e9f1" }}>
              {event.ticketTypes.map((tier) => {
                const available = tier.quantity - tier.soldCount;
                const picked = selected[tier.id] ?? [];
                const soldOut = available <= 0;
                const price = (tier.priceCents / 100).toLocaleString("it-IT", {
                  style: "currency",
                  currency: "EUR",
                  minimumFractionDigits: 0,
                });

                return (
                  <div
                    key={tier.id}
                    className="flex items-center gap-3 py-[14px]"
                    style={{ borderBottom: "1px solid #e6e9f1" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[14.5px] leading-snug">{tier.name}</div>
                      <div className="text-[12px] mt-[2px]" style={{ color: "#838ca0" }}>
                        Gate {tier.gate}
                        {soldOut
                          ? " · Sold out"
                          : picked.length > 0
                            ? ` · ${picked.map((id) => tier.seats.find((s) => s.id === id)?.label).join(", ")}`
                            : ""}
                      </div>
                    </div>

                    {soldOut ? (
                      <span
                        className="text-[12px] font-bold px-3 py-[5px] rounded-full shrink-0"
                        style={{ background: "#f4f6fb", color: "#9aa3b6" }}
                      >
                        Sold out
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="font-bold text-[16px] shrink-0 tabular-nums"
                          style={{ fontFamily: "Space Grotesk, system-ui" }}
                        >
                          {price}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => removeLastSeat(tier.id)}
                            disabled={picked.length === 0}
                            className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-[18px] transition-colors disabled:cursor-default"
                            style={{
                              borderColor: picked.length === 0 ? "#e6e9f1" : "#1452f0",
                              color: picked.length === 0 ? "#c8d0e0" : "#1452f0",
                            }}
                          >
                            −
                          </button>
                          <span
                            className="w-5 text-center font-bold text-[15px] tabular-nums"
                            style={{ fontFamily: "Space Grotesk, system-ui" }}
                          >
                            {picked.length}
                          </span>
                          <button
                            onClick={() => addAnySeat(tier.id)}
                            disabled={picked.length >= available || totalQty >= MAX_TICKETS_PER_ORDER}
                            className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-[18px] transition-colors disabled:cursor-default"
                            style={{
                              borderColor: picked.length >= available || totalQty >= MAX_TICKETS_PER_ORDER ? "#e6e9f1" : "#1452f0",
                              color: picked.length >= available || totalQty >= MAX_TICKETS_PER_ORDER ? "#c8d0e0" : "#1452f0",
                            }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between py-4 font-bold text-[15px]">
              <span>Total</span>
              <span
                className="text-[20px] tabular-nums"
                style={{ fontFamily: "Space Grotesk, system-ui" }}
              >
                {totalCents === 0
                  ? "—"
                  : (totalCents / 100).toLocaleString("it-IT", {
                      style: "currency",
                      currency: "EUR",
                      minimumFractionDigits: 0,
                    })}
              </span>
            </div>

            <button
              onClick={handleBuy}
              disabled={totalCents === 0 || checkingOut}
              className="w-full font-bold text-[15px] py-[14px] rounded-[12px] text-white transition-all disabled:cursor-default"
              style={{
                background: totalCents > 0 && !checkingOut ? "#1452f0" : "#c8d0e0",
                boxShadow: totalCents > 0 && !checkingOut ? "0 8px 20px rgba(20,82,240,.28)" : "none",
              }}
            >
              {checkingOut ? "Confirming your order…" : "Buy tickets"}
            </button>

            {checkoutError && (
              <p className="text-[12.5px] font-semibold text-center mt-2" style={{ color: "#c0392b" }}>
                {checkoutError}
              </p>
            )}

            {totalQty >= MAX_TICKETS_PER_ORDER && (
              <p className="text-[12.5px] font-semibold text-center mt-2" style={{ color: "#9aa3b6" }}>
                Limit of {MAX_TICKETS_PER_ORDER} tickets per order reached.
              </p>
            )}

            <div className="flex items-center gap-2 mt-4 text-[12px]" style={{ color: "#838ca0" }}>
              <svg className="w-[15px] h-[15px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 018 0v3" />
              </svg>
              Login required · Secure checkout
            </div>
          </div>
        </div>
      </div>

      <div className="mt-7">
        <VenueMap
          venueName={event.venueName}
          city={cityLabel}
          ticketTypes={event.ticketTypes}
          selected={selected}
          totalQty={totalQty}
          onToggleSeat={toggleSeat}
        />
      </div>
    </div>
  );
}
