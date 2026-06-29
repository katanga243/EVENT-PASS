import { getEvents } from "@/backend/services/events";
import Nav from "@/frontend/Nav";
import Footer from "@/frontend/Footer";
import EventCard from "@/frontend/EventCard";
import Image from "next/image";
import Link from "next/link";
import { City } from "@prisma/client";

export const revalidate = 30;

const CITY_FILTERS: { label: string; value?: City }[] = [
  { label: "All", value: undefined },
  { label: "Milano", value: "MILANO" },
  { label: "Torino", value: "TORINO" },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; city?: string; q?: string }>;
}) {
  const { notice, city: cityParam, q } = await searchParams;
  const city = cityParam === "MILANO" || cityParam === "TORINO" ? cityParam : undefined;
  let events: Awaited<ReturnType<typeof getEvents>> = [];
  let eventsLoadError = false;

  try {
    events = await getEvents(city, q);
  } catch (error) {
    eventsLoadError = true;
    console.error("Failed to load homepage events.", error);
  }

  return (
    <>
      <Nav activeCity={city} />
      <main className="flex-1">
        {notice === "organiser-only" && (
          <div
            className="text-center text-[13.5px] font-semibold py-3 px-4"
            style={{ background: "#fff5f5", color: "#c0392b" }}
          >
            That page is only available to organiser accounts.
          </div>
        )}

        <section
          className="relative min-h-[560px] flex items-end overflow-hidden"
          style={{ background: "#0a0a10" }}
        >
          <Image
            src="/hero.jpg"
            alt="EventPass hero"
            fill
            className="object-cover opacity-60"
            priority
          />
          <div
            className="absolute inset-0 z-[1]"
            style={{ background: "linear-gradient(180deg,rgba(10,10,16,.3),rgba(10,10,16,.15) 40%,rgba(10,10,16,.93))" }}
          />

          <div className="relative z-[2] w-full max-w-[1180px] mx-auto px-6 pb-11 pt-16">
            <p
              className="text-[13px] font-semibold uppercase tracking-[.14em] mb-[14px]"
              style={{ color: "#9db8ff", fontFamily: "var(--font-space, Space Grotesk)" }}
            >
              Where the city goes out.
            </p>
            <h1
              className="font-bold mb-[14px] text-white max-w-[780px]"
              style={{
                fontFamily: "var(--font-space, Space Grotesk, system-ui)",
                fontSize: "clamp(38px,6vw,68px)",
                letterSpacing: "-0.025em",
                lineHeight: 1.04,
              }}
            >
              Access to unforgettable moments.
            </h1>
            <p className="text-[18px] mb-[26px] max-w-[540px]" style={{ color: "#d4daea" }}>
              The fastest way to buy, manage, and scan event tickets across Milano and Torino.
            </p>

            <form
              action="/"
              method="GET"
              className="flex gap-2 p-2 rounded-[16px] max-w-[680px] flex-wrap"
              style={{ background: "#fff", boxShadow: "0 24px 60px rgba(12,24,56,.18)" }}
            >
              {city && <input type="hidden" name="city" value={city} />}
              <div className="flex items-center gap-2 px-[14px] py-[10px] flex-1 min-w-[150px] text-[14px] font-semibold" style={{ color: "#3a4254" }}>
                <svg className="w-[17px] h-[17px] shrink-0" style={{ color: "#1452f0" }} viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="7.5" cy="7.5" r="5" /><path d="m12.5 12.5 2.5 2.5" />
                </svg>
                <input
                  type="text"
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Search events or artist…"
                  className="font-medium w-full bg-transparent outline-none"
                  style={{ color: "#3a4254" }}
                />
              </div>
              <button
                type="submit"
                className="font-bold text-[14px] px-[20px] py-[12px] rounded-[12px] text-white shrink-0"
                style={{ background: "#1452f0", boxShadow: "0 8px 20px rgba(20,82,240,.28)" }}
              >
                Search
              </button>
            </form>

            <div className="flex gap-[22px] mt-[18px] text-[13px] font-semibold flex-wrap" style={{ color: "#aeb6cc" }}>
              {["Secure payments", "Instant QR tickets", "Free cancellation"].map((t) => (
                <span key={t} className="flex items-center gap-[7px]">
                  <svg className="w-[15px] h-[15px]" style={{ color: "#9db8ff" }} viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="m2.5 7.5 3.5 3.5 6.5-6.5" />
                  </svg>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="py-[72px]">
          <div className="max-w-[1180px] mx-auto px-6">
            <div className="flex items-end justify-between mb-7 gap-5 flex-wrap">
              <h2
                className="font-bold"
                style={{ fontFamily: "var(--font-space, Space Grotesk, system-ui)", fontSize: "clamp(26px,3.4vw,38px)", letterSpacing: "-0.025em" }}
              >
                {q ? `Results for "${q}"` : "Upcoming events"}
              </h2>
              <div className="flex gap-2">
                {CITY_FILTERS.map((f) => {
                  const isActive = f.value === city;
                  const params = new URLSearchParams();
                  if (f.value) params.set("city", f.value);
                  if (q) params.set("q", q);
                  const qs = params.toString();
                  return (
                    <Link
                      key={f.label}
                      href={qs ? `/?${qs}` : "/"}
                      className="text-[13.5px] font-bold px-[16px] py-[8px] rounded-full border-[1.5px]"
                      style={isActive
                        ? { background: "#0a0a0f", color: "#fff", borderColor: "#0a0a0f" }
                        : { color: "#3a4254", borderColor: "#e6e9f1" }}
                    >
                      {f.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {eventsLoadError ? (
              <p className="text-center py-20" style={{ color: "#838ca0" }}>
                Event data is unavailable. Check <code className="bg-[#f4f6fb] px-2 py-0.5 rounded">DATABASE_URL</code>, run migrations, then seed the database.
              </p>
            ) : events.length === 0 ? (
              <p className="text-center py-20" style={{ color: "#838ca0" }}>
                {q
                  ? `No events match "${q}"${city ? ` in ${city === "MILANO" ? "Milano" : "Torino"}` : ""}.`
                  : city
                  ? `No events in ${city === "MILANO" ? "Milano" : "Torino"} right now.`
                  : <>No events found. Run <code className="bg-[#f4f6fb] px-2 py-0.5 rounded">npm run db:seed</code> to load sample data.</>}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[22px]">
                {events.map((ev) => (
                  <EventCard
                    key={ev.id}
                    id={ev.id}
                    title={ev.title}
                    venueName={ev.venueName}
                    city={ev.city}
                    startsAt={ev.startsAt}
                    imageUrl={ev.imageUrl}
                    minPriceCents={Math.min(...ev.ticketTypes.map((t) => t.priceCents))}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
