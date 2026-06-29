"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface TicketViewProps {
  ticket: {
    id: string;
    holderName: string;
    gate: string;
    status: string;
    orderId: string;
    ticketTypeName: string;
    event: {
      title: string;
      venueName: string;
      city: string;
      imageUrl: string;
      dateStr: string;
      timeStr: string;
    };
  };
  qrDataUrl: string;
}

export default function TicketView({ ticket, qrDataUrl }: TicketViewProps) {
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      setSharing(true);
      try {
        await navigator.share({
          title: `${ticket.event.title} — EventPass`,
          text: `My ticket for ${ticket.event.title} at ${ticket.event.venueName}`,
          url,
        });
      } catch {
        // user cancelled
      } finally {
        setSharing(false);
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shortId = ticket.orderId.slice(-8).toUpperCase();

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #ticket-card, #ticket-card * { visibility: visible; }
          #ticket-card { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print mb-6">
        <Link
          href="/account/tickets"
          className="text-[#1452f0] text-sm font-medium flex items-center gap-1 hover:underline"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
              clipRule="evenodd"
            />
          </svg>
          All Tickets
        </Link>
      </div>

      <div
        id="ticket-card"
        className="flex rounded-3xl overflow-hidden shadow-2xl"
        style={{ minHeight: 320 }}
      >
        <div
          className="relative flex flex-col items-center justify-center gap-4 p-6"
          style={{ width: 240, minWidth: 240, backgroundColor: "#0a0a10" }}
        >
          <div className="absolute inset-0 overflow-hidden opacity-20">
            <Image
              src={ticket.event.imageUrl}
              alt=""
              fill
              className="object-cover blur-lg scale-110"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="bg-white rounded-2xl p-3">
              <img
                src={qrDataUrl}
                alt="QR code"
                width={180}
                height={180}
                className="block"
              />
            </div>
            <p className="text-white/50 text-[10px] font-semibold tracking-widest uppercase">
              Scan at the door
            </p>
          </div>
        </div>

        <div
          className="relative flex-shrink-0"
          style={{ width: 2, backgroundColor: "#e6e9f1" }}
        >
          <div
            className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-[#f4f6fb]"
            style={{ zIndex: 10 }}
          />
          <div
            className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-[#f4f6fb]"
            style={{ zIndex: 10 }}
          />
          <div
            className="absolute top-6 bottom-6 left-0 border-l-2 border-dashed border-[#e6e9f1]"
            style={{ left: 0 }}
          />
        </div>

        <div className="flex-1 bg-white p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-4 mb-1">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <Image src={ticket.event.imageUrl} alt="" fill className="object-cover" />
              </div>
              <h2
                className="text-2xl font-bold text-[#0a0a0f] leading-tight pt-1"
                style={{ fontFamily: "var(--font-space)" }}
              >
                {ticket.event.title}
              </h2>
            </div>

            <p className="text-[#0a0a0f]/60 text-sm mb-6">
              {ticket.event.venueName} · {ticket.event.city}
              <br />
              {ticket.event.dateStr} · {ticket.event.timeStr}
            </p>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <p className="text-[10px] font-semibold text-[#0a0a0f]/40 uppercase tracking-widest mb-0.5">
                  Holder
                </p>
                <p className="text-sm font-semibold text-[#0a0a0f]">{ticket.holderName}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#0a0a0f]/40 uppercase tracking-widest mb-0.5">
                  Ticket
                </p>
                <p className="text-sm font-semibold text-[#0a0a0f]">{ticket.ticketTypeName}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#0a0a0f]/40 uppercase tracking-widest mb-0.5">
                  Order
                </p>
                <p className="text-sm font-mono text-[#0a0a0f]">#{shortId}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#0a0a0f]/40 uppercase tracking-widest mb-0.5">
                  Status
                </p>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    ticket.status === "VALID"
                      ? "bg-emerald-100 text-emerald-700"
                      : ticket.status === "USED"
                        ? "bg-[#e6e9f1] text-[#0a0a0f]/50"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ backgroundColor: "#e8efff" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="#1452f0"
              >
                <path
                  fillRule="evenodd"
                  d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.387 1.445-.974 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                  clipRule="evenodd"
                />
              </svg>
              <span
                className="font-bold text-[#1452f0] text-sm"
                style={{ fontFamily: "var(--font-space)" }}
              >
                Gate {ticket.gate}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="no-print mt-6 flex flex-wrap gap-3">
        <a
          href={`/api/tickets/${ticket.id}/pdf`}
          download={`ticket-${shortId}.pdf`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1452f0] text-white text-sm font-semibold hover:bg-[#0e3fcf] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 3a.75.75 0 01.75.75v9.69l2.72-2.72a.75.75 0 111.06 1.06l-4 4a.75.75 0 01-1.06 0l-4-4a.75.75 0 111.06-1.06l2.72 2.72V3.75A.75.75 0 0110 3z"
              clipRule="evenodd"
            />
            <path d="M3 17.25a.75.75 0 011.5 0v.25h11v-.25a.75.75 0 011.5 0V18a.75.75 0 01-.75.75H3.75A.75.75 0 013 18v-.75z" />
          </svg>
          Save PDF
        </a>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#e6e9f1] bg-white text-sm font-semibold text-[#0a0a0f] hover:bg-[#f4f6fb] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h1v.5A1.5 1.5 0 006.5 19h7a1.5 1.5 0 001.5-1.5V17h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0v3h6V4H7zm8 11v.5a.5.5 0 01-.5.5h-7a.5.5 0 01-.5-.5V15H5V9h10v6h-2z"
              clipRule="evenodd"
            />
          </svg>
          Print
        </button>

        <button
          onClick={handleShare}
          disabled={sharing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#e6e9f1] bg-white text-sm font-semibold text-[#0a0a0f] hover:bg-[#f4f6fb] transition-colors disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.366A2.52 2.52 0 0113 4.5z" />
          </svg>
          {copied ? "Link copied!" : sharing ? "Sharing..." : "Share"}
        </button>
      </div>
    </>
  );
}
