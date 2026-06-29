import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { signOutAction } from "@/app/auth/actions";
import { getUserProfile } from "@/backend/services/users";
import UserMenu from "./UserMenu";

const CITY_PILLS = [
  { label: "All", href: "/" },
  { label: "Milano", href: "/?city=MILANO" },
  { label: "Torino", href: "/?city=TORINO" },
];

export default async function Nav({ activeCity }: { activeCity?: "MILANO" | "TORINO" } = {}) {
  const session = await auth();
  const user = session?.user;
  const profile = user ? await getUserProfile(user.id) : null;

  return (
    <nav
      className="sticky top-0 z-40 border-b"
      style={{
        background: "rgba(255,255,255,0.86)",
        backdropFilter: "saturate(180%) blur(14px)",
        borderColor: "#e6e9f1",
      }}
    >
      <div className="max-w-[1180px] mx-auto px-6 flex items-center gap-6 h-[68px]">
        <Link href="/" className="flex items-center gap-[10px] shrink-0">
          <Image src="/logo-badge.png" alt="EventPass" width={42} height={42} className="h-[42px] w-auto" />
          <span
            style={{ fontFamily: "var(--font-space, Space Grotesk, system-ui)", fontWeight: 800, fontSize: 23, letterSpacing: "-0.02em", color: "#0a0a0f" }}
          >
            Event<span style={{ color: "#1452f0" }}>Pass</span>
          </span>
        </Link>

        <div
          className="hidden sm:flex rounded-full p-[3px] border"
          style={{ background: "#f4f6fb", borderColor: "#e6e9f1" }}
        >
          {CITY_PILLS.map((c) => {
            const isActive = c.label === "All" ? !activeCity : c.label.toUpperCase() === activeCity;
            return (
              <Link
                key={c.label}
                href={c.href}
                className="text-[13px] font-bold px-[14px] py-[6px] rounded-full"
                style={{
                  color: isActive ? "#1452f0" : "#3a4254",
                  background: isActive ? "#fff" : "transparent",
                }}
              >
                {c.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex gap-[22px] text-[14px] font-semibold" style={{ color: "#3a4254" }}>
          <Link href="/organiser" className="hover:text-[#1452f0] transition-colors">Organisers</Link>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/account/tickets"
                className="hidden sm:block text-[14px] font-semibold hover:text-[#1452f0] transition-colors"
                style={{ color: "#3a4254" }}
              >
                My Tickets
              </Link>
              <UserMenu name={user.name ?? ""} avatarUrl={profile?.avatarUrl ?? null} signOutAction={signOutAction} />
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-[14px] font-bold cursor-pointer hover:text-[#1452f0] transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="flex items-center gap-2 font-bold text-[14px] px-[20px] py-[10px] rounded-[12px] text-white transition-opacity hover:opacity-90"
                style={{ background: "#1452f0", boxShadow: "0 8px 20px rgba(20,82,240,.28)" }}
              >
                Get tickets
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
