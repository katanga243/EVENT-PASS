"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  name: string;
  avatarUrl: string | null;
  signOutAction: () => Promise<void>;
};

export default function UserMenu({ name, avatarUrl, signOutAction }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-[14px] font-semibold"
        style={{ color: "#3a4254" }}
      >
        <span
          className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-[12px]"
          style={{ background: "#e8efff", color: "#1452f0" }}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill className="object-cover" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </span>
        <span className="hidden sm:block">{name}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="hidden sm:block transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+10px)] w-[200px] rounded-[14px] overflow-hidden py-1.5"
          style={{ background: "#fff", border: "1px solid #e6e9f1", boxShadow: "0 20px 50px rgba(12,24,56,.16)" }}
        >
          <Link
            href="/account/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-[10px] text-[14px] font-semibold hover:bg-[#f4f6fb] transition-colors"
            style={{ color: "#0a0a0f" }}
          >
            Profile
          </Link>
          <Link
            href="/account/profile/settings"
            onClick={() => setOpen(false)}
            className="block px-4 py-[10px] text-[14px] font-semibold hover:bg-[#f4f6fb] transition-colors"
            style={{ color: "#0a0a0f" }}
          >
            Settings
          </Link>
          <div style={{ borderTop: "1px solid #e6e9f1" }} className="my-1.5" />
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full text-left px-4 py-[10px] text-[14px] font-semibold hover:bg-[#fff5f5] transition-colors"
              style={{ color: "#c0392b" }}
            >
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
