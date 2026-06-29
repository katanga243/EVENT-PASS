"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { updateProfileAction } from "@/app/account/actions";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
};

export default function ProfileSettingsForm({ profile }: { profile: Profile }) {
  const [error, dispatch, isPending] = useActionState(updateProfileAction, null);
  const [preview, setPreview] = useState<string | null>(profile.avatarUrl);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  return (
    <form
      action={dispatch}
      className="bg-white rounded-[22px] p-7 flex flex-col gap-5"
      style={{ border: "1px solid #e6e9f1", boxShadow: "0 8px 30px rgba(12,24,56,.07)" }}
    >
      <div className="flex items-center gap-5">
        <div
          className="relative w-20 h-20 rounded-full overflow-hidden shrink-0"
          style={{ background: "#f4f6fb", border: "1px solid #e6e9f1" }}
        >
          {preview ? (
            <Image src={preview} alt="" fill className="object-cover" unoptimized={preview.startsWith("blob:")} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[22px] font-bold" style={{ color: "#9aa3b6" }}>
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="avatar"
            className="inline-block text-[13px] font-bold px-4 py-2 rounded-[10px] cursor-pointer"
            style={{ background: "#e8efff", color: "#1452f0" }}
          >
            Change photo
          </label>
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <p className="text-[12px] mt-1.5" style={{ color: "#9aa3b6" }}>
            JPEG, PNG, or WebP. Up to 3MB.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold" style={{ color: "#3a4254" }}>
          Full name
        </label>
        <input
          name="name"
          type="text"
          required
          defaultValue={profile.name}
          className="w-full px-4 py-[11px] rounded-[10px] text-[14px] outline-none"
          style={{ border: "1.5px solid #e6e9f1", background: "#f9fafc" }}
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
          defaultValue={profile.email}
          className="w-full px-4 py-[11px] rounded-[10px] text-[14px] outline-none"
          style={{ border: "1.5px solid #e6e9f1", background: "#f9fafc" }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold" style={{ color: "#3a4254" }}>
          Phone
        </label>
        <input
          name="phone"
          type="tel"
          defaultValue={profile.phone ?? ""}
          placeholder="+39 333 123 4567"
          className="w-full px-4 py-[11px] rounded-[10px] text-[14px] outline-none"
          style={{ border: "1.5px solid #e6e9f1", background: "#f9fafc" }}
        />
      </div>

      {error && (
        <p className="text-[13px] font-semibold text-center py-2 px-3 rounded-[8px]" style={{ color: "#c0392b", background: "#fff5f5" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="font-bold text-[15px] py-[13px] rounded-[12px] text-white transition-opacity disabled:opacity-60"
        style={{ background: "#1452f0", boxShadow: "0 8px 20px rgba(20,82,240,.28)" }}
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
