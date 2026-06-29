"use client";

import { checkPasswordRules, type PersonalInfo } from "@/lib/passwordRules";

type Props = {
  password: string;
  info: PersonalInfo;
};

export default function PasswordStrength({ password, info }: Props) {
  if (!password) return null;

  const results = checkPasswordRules(password, info);

  return (
    <ul className="flex flex-col gap-1 mt-1">
      {results.map((r) => (
        <li
          key={r.id}
          className="flex items-center gap-2 text-[12.5px] font-medium"
          style={{ color: r.passed ? "#1a7f4b" : "#c0392b" }}
        >
          <span
            className="w-[14px] h-[14px] rounded-full flex items-center justify-center shrink-0"
            style={{ background: r.passed ? "#e8fff0" : "#fff5f5" }}
          >
            {r.passed ? (
              <svg viewBox="0 0 14 14" fill="none" className="w-[9px] h-[9px]" stroke="#1a7f4b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 7 5.5 10 11.5 4" />
              </svg>
            ) : (
              <svg viewBox="0 0 14 14" fill="none" className="w-[8px] h-[8px]" stroke="#c0392b" strokeWidth="2" strokeLinecap="round">
                <path d="M3 3l8 8M11 3l-8 8" />
              </svg>
            )}
          </span>
          {r.label}
        </li>
      ))}
    </ul>
  );
}
