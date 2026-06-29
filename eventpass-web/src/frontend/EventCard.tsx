import Image from "next/image";
import Link from "next/link";

type Props = {
  id: string;
  title: string;
  venueName: string;
  city: "MILANO" | "TORINO";
  startsAt: Date;
  imageUrl: string;
  minPriceCents: number;
};

export default function EventCard({ id, title, venueName, city, startsAt, imageUrl, minPriceCents }: Props) {
  const dateStr = new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  }).format(new Date(startsAt));

  const price = (minPriceCents / 100).toLocaleString("it-IT", {
    style: "currency", currency: "EUR", minimumFractionDigits: 0,
  });

  return (
    <Link
      href={`/events/${id}`}
      className="group block rounded-[18px] overflow-hidden border bg-white transition-all duration-300 hover:-translate-y-1"
      style={{ borderColor: "#e6e9f1", boxShadow: "0 8px 30px rgba(12,24,56,.10)" }}
    >
      <div className="relative aspect-[3/2] bg-[#f4f6fb] overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <span
            className="text-[12px] font-bold px-[11px] py-[5px] rounded-full text-white"
            style={{ background: city === "MILANO" ? "#1452f0" : "#0a0a0f" }}
          >
            {city === "MILANO" ? "Milano" : "Torino"}
          </span>
          <span
            className="text-[12px] font-bold px-[11px] py-[5px] rounded-full"
            style={{ background: "rgba(255,255,255,.92)", backdropFilter: "blur(6px)" }}
          >
            {dateStr}
          </span>
        </div>
      </div>

      <div className="px-[17px] pt-[14px] pb-[18px]">
        <p className="text-[12.5px] font-semibold flex items-center gap-1 mb-[6px]" style={{ color: "#838ca0" }}>
          <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 1.5C5.51 1.5 3.5 3.51 3.5 6c0 3.75 4.5 8.5 4.5 8.5S12.5 9.75 12.5 6c0-2.49-2.01-4.5-4.5-4.5z"/>
            <circle cx="8" cy="6" r="1.5"/>
          </svg>
          {venueName}
        </p>

        <h3 className="text-[18px] font-extrabold mb-[14px] leading-[1.2]" style={{ letterSpacing: "-0.02em" }}>
          {title}
        </h3>

        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold" style={{ color: "#3a4254" }}>
            From{" "}
            <span style={{ fontFamily: "var(--font-space, Space Grotesk, system-ui)", fontSize: 17, color: "#0a0a0f", fontWeight: 700 }}>
              {price}
            </span>
          </p>
          <button
            className="text-[13px] font-bold flex items-center gap-1 px-[15px] py-[9px] rounded-[10px] border-0 cursor-pointer"
            style={{ color: "#1452f0", background: "#e8efff" }}
          >
            Get tickets
            <svg viewBox="0 0 14 14" fill="none" className="w-[14px] h-[14px]" stroke="currentColor" strokeWidth="2">
              <path d="M2.5 7h9M7.5 3.5 11 7l-3.5 3.5"/>
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}
