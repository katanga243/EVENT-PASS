"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createUserAction } from "../actions";
import PasswordStrength from "@/frontend/PasswordStrength";
import { isPasswordValid } from "@/lib/passwordRules";

export default function SignUpPage() {
  const [error, dispatch, isPending] = useActionState(createUserAction, null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const passwordOk = isPasswordValid(password, { name, email });

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
            Create your account
          </h1>
          <p className="text-[14px] mt-1 text-center" style={{ color: "#838ca0" }}>
            Buy and manage tickets in seconds.
          </p>
        </div>

        <form action={dispatch} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" style={{ color: "#3a4254" }}>
              Full name
            </label>
            <input
              name="name"
              type="text"
              required
              autoFocus
              autoComplete="name"
              placeholder="Jean Dedieu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-[11px] rounded-[10px] text-[14px] outline-none transition-all"
              style={{ border: "1.5px solid #e6e9f1", background: "#f9fafc" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#1452f0")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e6e9f1")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold" style={{ color: "#3a4254" }}>
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-[11px] rounded-[10px] text-[14px] outline-none transition-all"
              style={{ border: "1.5px solid #e6e9f1", background: "#f9fafc" }}
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
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-[11px] rounded-[10px] text-[14px] outline-none transition-all"
              style={{
                border: password && !passwordOk ? "1.5px solid #e08a8a" : "1.5px solid #e6e9f1",
                background: "#f9fafc",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#1452f0")}
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = password && !passwordOk ? "#e08a8a" : "#e6e9f1")
              }
            />
            <PasswordStrength password={password} info={{ name, email }} />
          </div>

          {error && (
            <p
              className="text-[13px] font-semibold text-center py-2 px-3 rounded-[8px]"
              style={{ color: "#c0392b", background: "#fff5f5" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || !passwordOk}
            className="mt-1 w-full font-bold text-[15px] py-[13px] rounded-[12px] text-white transition-opacity disabled:opacity-60"
            style={{ background: "#1452f0", boxShadow: "0 8px 20px rgba(20,82,240,.28)" }}
          >
            {isPending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-[12px] mt-4 text-center" style={{ color: "#9aa3b6" }}>
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>

        <div className="mt-5 pt-5 text-center text-[13.5px]" style={{ borderTop: "1px solid #e6e9f1", color: "#838ca0" }}>
          Already have an account?{" "}
          <Link href="/auth/signin" className="font-bold" style={{ color: "#1452f0" }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
