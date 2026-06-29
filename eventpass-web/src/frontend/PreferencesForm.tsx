"use client";

import { useState, useTransition } from "react";
import { useTheme } from "./ThemeProvider";
import { setThemeAction, setNotificationsAction } from "@/app/account/actions";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-[46px] h-[26px] rounded-full relative transition-colors shrink-0"
      style={{ background: on ? "#1452f0" : "#e6e9f1" }}
    >
      <span
        className="absolute top-[3px] w-[20px] h-[20px] rounded-full bg-white transition-all"
        style={{ left: on ? "23px" : "3px", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }}
      />
    </button>
  );
}

export default function PreferencesForm({
  initialNotifications,
}: {
  initialNotifications: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [, startTransition] = useTransition();

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    startTransition(() => {
      setThemeAction(next);
    });
  }

  function toggleNotifications() {
    const next = !notifications;
    setNotifications(next);
    startTransition(() => {
      setNotificationsAction(next);
    });
  }

  const rowClass = "flex items-center justify-between gap-4 py-4";
  const titleStyle = { color: "#0a0a0f" };
  const subStyle = { color: "var(--color-ink3, #838ca0)" };

  return (
    <div
      className="bg-white rounded-[22px] p-7 flex flex-col divide-y mt-6"
      style={{ border: "1px solid #e6e9f1", boxShadow: "0 8px 30px rgba(12,24,56,.07)", borderColor: undefined }}
    >
      <h2 className="text-[16px] font-bold pb-4" style={{ fontFamily: "var(--font-space)", color: "#0a0a0f" }}>
        Preferences
      </h2>

      <div className={rowClass} style={{ borderColor: "#e6e9f1" }}>
        <div>
          <p className="text-[14px] font-bold" style={titleStyle}>Email notifications</p>
          <p className="text-[12px] mt-0.5" style={subStyle}>
            Receive order confirmations and event reminders by email.
          </p>
        </div>
        <Toggle on={notifications} onClick={toggleNotifications} />
      </div>

      <div className={rowClass} style={{ borderColor: "#e6e9f1" }}>
        <div>
          <p className="text-[14px] font-bold" style={titleStyle}>Dark mode</p>
          <p className="text-[12px] mt-0.5" style={subStyle}>
            Switch between light and dark appearance.
          </p>
        </div>
        <Toggle on={theme === "dark"} onClick={toggleTheme} />
      </div>
    </div>
  );
}
