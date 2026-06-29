import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { getUserProfile } from "@/backend/services/users";

export const metadata = { title: "Profile — EventPass" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/account/profile");

  const profile = await getUserProfile(session.user.id);
  if (!profile) redirect("/auth/signin?callbackUrl=/account/profile");

  return (
    <main className="min-h-screen bg-[#f4f6fb] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1
          className="text-3xl font-bold text-[#0a0a0f] mb-8"
          style={{ fontFamily: "var(--font-space)" }}
        >
          Profile
        </h1>

        <div
          className="bg-white rounded-[22px] p-7 flex items-center gap-5"
          style={{ border: "1px solid #e6e9f1", boxShadow: "0 8px 30px rgba(12,24,56,.07)" }}
        >
          <div
            className="relative w-20 h-20 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-[28px]"
            style={{ background: "#e8efff", color: "#1452f0" }}
          >
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt="" fill className="object-cover" />
            ) : (
              profile.name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[19px] font-bold text-[#0a0a0f]">{profile.name}</p>
            <p className="text-[14px] mt-0.5" style={{ color: "#838ca0" }}>
              {profile.email}
            </p>
            {profile.phone && (
              <p className="text-[14px] mt-0.5" style={{ color: "#838ca0" }}>
                {profile.phone}
              </p>
            )}
          </div>

          <Link
            href="/account/profile/settings"
            className="font-bold text-[14px] px-5 py-[10px] rounded-[10px] shrink-0"
            style={{ background: "#e8efff", color: "#1452f0" }}
          >
            Edit
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <Link
            href="/account/tickets"
            className="bg-white rounded-[18px] p-6 flex items-center justify-between hover:shadow-md transition-shadow"
            style={{ border: "1px solid #e6e9f1" }}
          >
            <span className="font-bold text-[15px] text-[#0a0a0f]">My Tickets</span>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" style={{ color: "#9aa3b6" }}>
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <Link
            href="/account/profile/settings"
            className="bg-white rounded-[18px] p-6 flex items-center justify-between hover:shadow-md transition-shadow"
            style={{ border: "1px solid #e6e9f1" }}
          >
            <span className="font-bold text-[15px] text-[#0a0a0f]">Settings</span>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" style={{ color: "#9aa3b6" }}>
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
}
