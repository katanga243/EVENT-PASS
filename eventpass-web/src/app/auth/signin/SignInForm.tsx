"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Props = {
  callbackUrl: string;
  created?: boolean;
  defaultEmail?: string;
};

export default function SignInForm({ callbackUrl, created, defaultEmail }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: fd.get("email") as string,
      password: fd.get("password") as string,
      redirect: false,
    });

    if (result?.ok) {
      router.push(callbackUrl);
      router.refresh();
    } else {
      setError("Incorrect email or password.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: "#f4f6fb" }}>
      <div
        className="w-full max-w-[420px] bg-white rounded-[24px] p-9"
        style={{ border: "1px solid #e6e9f1", boxShadow: "0 20px 60px rgba(12,24,56,.10)" }}
      >
        <div className="flex flex-col items-center mb-7">
          <Image src="/logo-badge.png" alt="EventPass" width={48} height={48} className="mb-4" />
          <h1
            className="font-bold text-[24px] text-center"
            style={{ fontFamily: "Space Grotesk, system-ui", letterSpacing: "-0.025em" }}
          >
            Sign in to EventPass
          </h1>
          <p className="text-[14px] mt-1 text-center" style={{ color: "#838ca0" }}>
            Enter your details to continue.
          </p>
        </div>

        {created && (
          <div
            className="mb-5 text-[13.5px] font-semibold text-center py-[10px] px-4 rounded-[10px]"
            style={{ background: "#e8fff0", color: "#1a7f4b" }}
          >
            Account created! Sign in below.
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" style={{ color: "#3a4254" }}>
              Email
            </label>
            <input
              name="email"
              type="email"
              defaultValue={defaultEmail}
              required
              autoFocus={!defaultEmail}
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-4 py-[11px] rounded-[10px] text-[14px] outline-none transition-all"
              style={{
                border: "1.5px solid #e6e9f1",
                background: "#f9fafc",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#1452f0")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e6e9f1")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" style={{ color: "#3a4254" }}>
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              autoFocus={!!defaultEmail}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-[11px] rounded-[10px] text-[14px] outline-none transition-all"
              style={{
                border: "1.5px solid #e6e9f1",
                background: "#f9fafc",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#1452f0")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e6e9f1")}
            />
          </div>

          {error && (
            <p className="text-[13px] font-semibold text-center py-2 px-3 rounded-[8px]" style={{ color: "#c0392b", background: "#fff5f5" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full font-bold text-[15px] py-[13px] rounded-[12px] text-white transition-opacity disabled:opacity-60"
            style={{ background: "#1452f0", boxShadow: "0 8px 20px rgba(20,82,240,.28)" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 pt-6 text-center text-[13.5px]" style={{ borderTop: "1px solid #e6e9f1", color: "#838ca0" }}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-bold" style={{ color: "#1452f0" }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
