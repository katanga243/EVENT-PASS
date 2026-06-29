import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ background: "#0a0a10", color: "#fff" }} className="mt-auto">
      <div className="max-w-[1180px] mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="flex items-center gap-[10px] mb-4">
            <Image src="/logo-badge.png" alt="EventPass" width={38} height={38} className="h-[38px] w-auto brightness-200" />
            <span style={{ fontFamily: "var(--font-space, Space Grotesk, system-ui)", fontWeight: 800, fontSize: 20 }}>
              Event<span style={{ color: "#1452f0" }}>Pass</span>
            </span>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: "#838ca0" }}>
            Access to unforgettable moments.
          </p>
        </div>

        {[
          { title: "Discover", links: [{ label: "Milano", href: "/?city=MILANO" }, { label: "Torino", href: "/?city=TORINO" }, { label: "All Events", href: "/" }] },
          { title: "Company", links: [{ label: "About", href: "#" }, { label: "Organisers", href: "/organiser" }, { label: "Contact", href: "#" }] },
          { title: "Legal", links: [{ label: "Terms", href: "#" }, { label: "Privacy", href: "#" }, { label: "Cookies", href: "#" }] },
        ].map((col) => (
          <div key={col.title}>
            <p className="text-[12px] font-bold uppercase tracking-widest mb-4" style={{ color: "#838ca0" }}>
              {col.title}
            </p>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[14px] hover:text-[#1452f0] transition-colors" style={{ color: "#838ca0" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t" style={{ borderColor: "#1a1a24" }}>
        <div className="max-w-[1180px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-[12px]" style={{ color: "#838ca0" }}>
          <span>&copy; {new Date().getFullYear()} EventPass. All rights reserved.</span>
          <span>Milano &amp; Torino</span>
        </div>
      </div>
    </footer>
  );
}
