import Nav from "@/frontend/Nav";
import Footer from "@/frontend/Footer";
import Link from "next/link";

export const metadata = { title: "Order confirmed — EventPass" };

export default function CheckoutSuccessPage() {
  return (
    <>
      <Nav />
      <main className="flex-1 flex items-center justify-center" style={{ background: "#f4f6fb", minHeight: "60vh" }}>
        <div className="text-center max-w-[520px] px-6 py-16">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "#e8fff0" }}
          >
            <svg
              className="w-10 h-10"
              style={{ color: "#1a7f4b" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m5 13 4 4L19 7" />
            </svg>
          </div>

          <h1
            className="font-bold text-[32px] mb-3"
            style={{ fontFamily: "Space Grotesk, system-ui", letterSpacing: "-0.03em" }}
          >
            Order confirmed!
          </h1>

          <p className="text-[16px] mb-8 leading-[1.7]" style={{ color: "#3a4254" }}>
            Your tickets are ready. Find them in{" "}
            <b>My Tickets</b> — tap below to view them now.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/account/tickets"
              className="font-bold text-[15px] px-7 py-[13px] rounded-[12px] text-white transition-opacity hover:opacity-90"
              style={{ background: "#1452f0", boxShadow: "0 8px 20px rgba(20,82,240,.28)" }}
            >
              View my tickets
            </Link>
            <Link
              href="/"
              className="font-bold text-[15px] px-7 py-[13px] rounded-[12px] transition-colors hover:border-[#1452f0]"
              style={{ background: "#fff", border: "1.5px solid #e6e9f1", color: "#3a4254" }}
            >
              Browse more events
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
