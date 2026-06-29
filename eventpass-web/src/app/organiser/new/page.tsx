import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import CreateEventForm from "@/frontend/CreateEventForm";

export const metadata = { title: "Create Event — EventPass" };

export default async function NewEventPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/organiser/new");
  if ((session.user as { role: string }).role !== "ORGANISER") redirect("/?notice=organiser-only");

  return (
    <main className="min-h-screen bg-[#f4f6fb] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/organiser"
          className="text-[#1452f0] text-sm font-medium flex items-center gap-1 hover:underline mb-6"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
              clipRule="evenodd"
            />
          </svg>
          My Events
        </Link>

        <h1
          className="text-3xl font-bold text-[#0a0a0f] mb-8"
          style={{ fontFamily: "var(--font-space)" }}
        >
          Create Event
        </h1>

        <CreateEventForm />
      </div>
    </main>
  );
}
