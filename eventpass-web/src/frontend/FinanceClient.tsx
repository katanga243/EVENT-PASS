"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type FinanceEvent = {
  id: string;
  title: string;
  venueName: string;
  city: string;
  startsAt: string;
  imageUrl: string;
  ticketsSold: number;
  totalCapacity: number;
  revenueCents: number;
  isPast: boolean;
};

type Summary = {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  totalRevenueCents: number;
};

function formatEUR(cents: number) {
  return (cents / 100).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  });
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function MiniCalendar({
  year,
  month,
  eventDays,
  selectedDay,
  onSelectDay,
}: {
  year: number;
  month: number;
  eventDays: Set<number>;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
}) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#e6e9f1] p-4">
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-[11px] font-bold text-[#838ca0]">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const hasEvent = eventDays.has(day);
          const isSelected = selectedDay === day;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDay(isSelected ? null : day)}
              className="aspect-square rounded-lg text-[13px] font-semibold relative flex items-center justify-center transition-colors"
              style={{
                background: isSelected ? "#1452f0" : hasEvent ? "#e8efff" : "transparent",
                color: isSelected ? "#fff" : hasEvent ? "#1452f0" : "#0a0a0f",
              }}
            >
              {day}
              {hasEvent && !isSelected && (
                <span
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ background: "#1452f0" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FinanceClient({
  events,
  summary,
}: {
  events: FinanceEvent[];
  summary: Summary;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState<number | "ALL">("ALL");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const years = useMemo(() => {
    const set = new Set(events.map((e) => new Date(e.startsAt).getFullYear()));
    set.add(now.getFullYear());
    return Array.from(set).sort();
  }, [events, now]);

  const calendarMonth = month === "ALL" ? now.getMonth() : month;

  const eventDays = useMemo(() => {
    const days = new Set<number>();
    events.forEach((e) => {
      const d = new Date(e.startsAt);
      if (d.getFullYear() === year && d.getMonth() === calendarMonth) days.add(d.getDate());
    });
    return days;
  }, [events, year, calendarMonth]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const d = new Date(e.startsAt);
      if (d.getFullYear() !== year) return false;
      if (month !== "ALL" && d.getMonth() !== month) return false;
      if (selectedDay !== null && d.getDate() !== selectedDay) return false;
      return true;
    });
  }, [events, year, month, selectedDay]);

  const upcoming = filtered.filter((e) => !e.isPast);
  const past = filtered.filter((e) => e.isPast);
  const filteredRevenue = filtered.reduce((sum, e) => sum + e.revenueCents, 0);

  function renderEventRow(ev: FinanceEvent) {
    const dt = new Date(ev.startsAt);
    const dateStr = dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const pct = ev.totalCapacity > 0 ? Math.round((ev.ticketsSold / ev.totalCapacity) * 100) : 0;
    return (
      <Link
        key={ev.id}
        href={`/organiser/${ev.id}`}
        className="flex items-center gap-4 bg-white rounded-2xl border border-[#e6e9f1] p-4 hover:shadow-md transition-shadow"
      >
        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
          <Image src={ev.imageUrl} alt={ev.title} fill className="object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#0a0a0f] truncate" style={{ fontFamily: "var(--font-space)" }}>
            {ev.title}
          </p>
          <p className="text-sm text-[#0a0a0f]/60 mt-0.5">
            {ev.venueName} · {ev.city === "MILANO" ? "Milano" : "Torino"} · {dateStr}
          </p>
          <p className="text-sm text-[#1452f0] font-medium mt-1">
            {ev.ticketsSold} / {ev.totalCapacity} sold ({pct}%) · {formatEUR(ev.revenueCents)} revenue
          </p>
        </div>
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total events", value: summary.totalEvents },
          { label: "Upcoming", value: summary.upcomingEvents },
          { label: "Past", value: summary.pastEvents },
          { label: "Total revenue", value: formatEUR(summary.totalRevenueCents) },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-[#e6e9f1] p-4">
            <p className="text-[12px] font-semibold text-[#838ca0] uppercase tracking-wide">{card.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-space)", color: "#0a0a0f" }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={year}
          onChange={(e) => { setYear(Number(e.target.value)); setSelectedDay(null); }}
          className="px-3 py-2 rounded-[10px] text-[14px] font-semibold border"
          style={{ borderColor: "#e6e9f1", background: "#fff", color: "#0a0a0f" }}
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        <select
          value={month}
          onChange={(e) => { setMonth(e.target.value === "ALL" ? "ALL" : Number(e.target.value)); setSelectedDay(null); }}
          className="px-3 py-2 rounded-[10px] text-[14px] font-semibold border"
          style={{ borderColor: "#e6e9f1", background: "#fff", color: "#0a0a0f" }}
        >
          <option value="ALL">All months</option>
          {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
        </select>

        <button
          type="button"
          onClick={() => setShowCalendar((v) => !v)}
          className="px-4 py-2 rounded-[10px] text-[14px] font-bold"
          style={{ background: showCalendar ? "#1452f0" : "#e8efff", color: showCalendar ? "#fff" : "#1452f0" }}
        >
          {showCalendar ? "Hide calendar" : "Calendar view"}
        </button>

        {selectedDay !== null && (
          <button
            type="button"
            onClick={() => setSelectedDay(null)}
            className="px-3 py-2 rounded-[10px] text-[13px] font-semibold"
            style={{ color: "#838ca0" }}
          >
            Clear day filter ×
          </button>
        )}

        <Link
          href="/organiser/new"
          className="ml-auto flex items-center gap-2 font-bold text-[14px] px-5 py-[10px] rounded-[12px] text-white transition-opacity hover:opacity-90"
          style={{ background: "#1452f0", boxShadow: "0 8px 20px rgba(20,82,240,.28)" }}
        >
          + Create event
        </Link>
      </div>

      {showCalendar && (
        <MiniCalendar
          year={year}
          month={calendarMonth}
          eventDays={eventDays}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      )}

      <p className="text-[13px] font-semibold text-[#838ca0]">
        {filtered.length} event{filtered.length === 1 ? "" : "s"} in view · {formatEUR(filteredRevenue)} revenue
      </p>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-[#e6e9f1]">
          <p className="text-[#0a0a0f]/50">No events match this filter.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-[15px] font-bold text-[#0a0a0f]">Upcoming</h2>
              {upcoming.map(renderEventRow)}
            </div>
          )}
          {past.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="text-[15px] font-bold text-[#0a0a0f]">Past</h2>
              {past.map(renderEventRow)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
