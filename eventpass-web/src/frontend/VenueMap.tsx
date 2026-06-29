"use client";

import { MAX_TICKETS_PER_ORDER } from "@/lib/orderLimits";

type Seat = {
  id: string;
  label: string;
  status: "AVAILABLE" | "SOLD";
};

type TicketType = {
  id: string;
  name: string;
  gate: string;
  quantity: number;
  soldCount: number;
  seats: Seat[];
};

type Props = {
  venueName: string;
  city: string;
  ticketTypes: TicketType[];
  selected: Record<string, string[]>;
  totalQty: number;
  onToggleSeat: (tierId: string, seatId: string) => void;
};

function arcPosition(index: number, count: number) {
  const maxAngle = count <= 1 ? 0 : 62;
  const angleDeg = count <= 1 ? 0 : -maxAngle + (index * (2 * maxAngle)) / (count - 1);
  const angle = (angleDeg * Math.PI) / 180;
  const radius = 165;
  const cx = 380;
  const cy = 55;
  const x = cx + radius * Math.sin(angle);
  const y = cy + radius * (1 - Math.cos(angle)) * 0.85;
  return { x, y };
}

export default function VenueMap({ venueName, city, ticketTypes, selected, totalQty, onToggleSeat }: Props) {
  function scrollToSection(tierId: string) {
    document.getElementById(`seat-grid-${tierId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div
      className="bg-white rounded-[22px] p-7"
      style={{ border: "1px solid #e6e9f1", boxShadow: "0 8px 30px rgba(12,24,56,.07)" }}
    >
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <h3
          className="font-bold text-[20px]"
          style={{ fontFamily: "Space Grotesk, system-ui", letterSpacing: "-0.02em" }}
        >
          Pick your seats — {venueName}, {city}
        </h3>
        <div className="flex gap-4 flex-wrap text-[12.5px] font-semibold" style={{ color: "#838ca0" }}>
          <span className="flex items-center gap-[7px]">
            <span className="w-3 h-3 rounded-[3px] inline-block border" style={{ background: "#fff", borderColor: "#cfd6e6" }} />
            Available
          </span>
          <span className="flex items-center gap-[7px]">
            <span className="w-3 h-3 rounded-[3px] inline-block" style={{ background: "#1452f0" }} />
            Selected
          </span>
          <span className="flex items-center gap-[7px]">
            <span className="w-3 h-3 rounded-[3px] inline-block" style={{ background: "#dce2ee" }} />
            Taken
          </span>
        </div>
      </div>
      <p className="text-[12.5px] mb-4" style={{ color: "#9aa3b6" }}>
        Click a section to jump to its seats, then tap a seat to select it — once it's taken, nobody else can pick it.
      </p>

      <svg viewBox="0 0 760 260" style={{ width: "100%", height: "auto" }}>
        <rect x="20" y="10" width="720" height="240" rx="20" fill="#f7f9fd" stroke="#dce2ee" strokeWidth="2" />

        <rect x="290" y="28" width="180" height="46" rx="8" fill="#0a0a10" />
        <text x="380" y="56" fill="#fff" fontSize="14" fontWeight="700" textAnchor="middle" fontFamily="Space Grotesk, system-ui" letterSpacing="2">
          STAGE
        </text>

        {ticketTypes.map((tier, i) => {
          const available = tier.quantity - tier.soldCount;
          const soldOut = available <= 0;
          const picked = (selected[tier.id] ?? []).length;
          const { x, y } = arcPosition(i, ticketTypes.length);
          const w = 130;
          const h = 64;

          return (
            <g
              key={tier.id}
              onClick={() => scrollToSection(tier.id)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={x - w / 2}
                y={y + 70}
                width={w}
                height={h}
                rx={12}
                fill={soldOut ? "#f4f6fb" : picked > 0 ? "#1452f0" : "#fff"}
                stroke={soldOut ? "#e6e9f1" : picked > 0 ? "none" : "#cfd6e6"}
                strokeWidth="2"
              />
              <text
                x={x}
                y={y + 70 + 26}
                fill={soldOut ? "#9aa3b6" : picked > 0 ? "#fff" : "#0a0a10"}
                fontSize="13"
                fontWeight="700"
                textAnchor="middle"
                fontFamily="Space Grotesk, system-ui"
              >
                Gate {tier.gate}
              </text>
              <text
                x={x}
                y={y + 70 + 42}
                fill={soldOut ? "#9aa3b6" : picked > 0 ? "#cfe0ff" : "#838ca0"}
                fontSize="10.5"
                textAnchor="middle"
              >
                {tier.name.length > 16 ? tier.name.slice(0, 15) + "…" : tier.name}
              </text>
              <text
                x={x}
                y={y + 70 + 56}
                fill={soldOut ? "#c8d0e0" : picked > 0 ? "#cfe0ff" : "#9aa3b6"}
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
              >
                {soldOut ? "Sold out" : picked > 0 ? `${picked} selected` : `${available} left`}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-col gap-6 mt-6">
        {ticketTypes.map((tier) => {
          const available = tier.quantity - tier.soldCount;
          const picked = selected[tier.id] ?? [];

          return (
            <div key={tier.id} id={`seat-grid-${tier.id}`}>
              <div className="flex items-baseline justify-between mb-2.5 flex-wrap gap-1">
                <p className="text-[14px] font-bold text-[#0a0a0f]">
                  {tier.name} <span style={{ color: "#9aa3b6", fontWeight: 600 }}>· Gate {tier.gate}</span>
                </p>
                <p className="text-[12px] font-semibold" style={{ color: "#9aa3b6" }}>
                  {available > 0 ? `${available} of ${tier.quantity} available` : "Sold out"}
                </p>
              </div>

              <div
                className="flex flex-wrap gap-[5px] p-3 rounded-[14px] max-h-[180px] overflow-y-auto"
                style={{ background: "#f7f9fd", border: "1px solid #eef1f7" }}
              >
                {tier.seats.map((seat) => {
                  const isSelected = picked.includes(seat.id);
                  const isTaken = seat.status === "SOLD";
                  const canClick = !isTaken && (isSelected || totalQty < MAX_TICKETS_PER_ORDER);

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      title={isTaken ? `${seat.label} · taken` : seat.label}
                      disabled={!canClick}
                      onClick={() => onToggleSeat(tier.id, seat.id)}
                      className="w-[18px] h-[18px] rounded-[4px] shrink-0 transition-colors"
                      style={{
                        background: isTaken ? "#dce2ee" : isSelected ? "#1452f0" : "#fff",
                        border: isTaken || isSelected ? "none" : "1px solid #cfd6e6",
                        cursor: canClick ? "pointer" : isTaken ? "not-allowed" : "default",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
