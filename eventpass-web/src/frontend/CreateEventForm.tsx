"use client";

import { useActionState } from "react";
import { createEventAction } from "@/app/organiser/actions";

const inputClass =
  "w-full px-4 py-[11px] rounded-[10px] text-[14px] outline-none";
const inputStyle = { border: "1.5px solid #e6e9f1", background: "#f9fafc" };
const labelClass = "text-[13px] font-semibold";
const labelStyle = { color: "#3a4254" };

export default function CreateEventForm() {
  const [error, dispatch, isPending] = useActionState(createEventAction, null);

  return (
    <form
      action={dispatch}
      className="bg-white rounded-[22px] p-7 flex flex-col gap-5"
      style={{ border: "1px solid #e6e9f1", boxShadow: "0 8px 30px rgba(12,24,56,.07)" }}
    >
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} style={labelStyle}>Event title</label>
        <input name="title" type="text" required className={inputClass} style={inputStyle} placeholder="Notte Elettronica" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} style={labelStyle}>Description</label>
        <textarea name="description" required rows={3} className={inputClass} style={inputStyle} placeholder="A night of electronic music..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={labelStyle}>Venue</label>
          <input name="venueName" type="text" required className={inputClass} style={inputStyle} placeholder="Magazzini Generali" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={labelStyle}>City</label>
          <select name="city" required defaultValue="MILANO" className={inputClass} style={inputStyle}>
            <option value="MILANO">Milano</option>
            <option value="TORINO">Torino</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={labelStyle}>Date</label>
          <input name="date" type="date" required className={inputClass} style={inputStyle} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} style={labelStyle}>Time</label>
          <input name="time" type="time" required className={inputClass} style={inputStyle} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={labelClass} style={labelStyle}>Cover image URL</label>
        <input name="imageUrl" type="url" required className={inputClass} style={inputStyle} placeholder="https://..." />
      </div>

      <div className="pt-2 border-t" style={{ borderColor: "#e6e9f1" }}>
        <p className="text-[13px] font-bold mb-3" style={{ color: "#0a0a0f" }}>Ticket type</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={labelStyle}>Name</label>
            <input name="ticketName" type="text" required className={inputClass} style={inputStyle} placeholder="General Admission" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={labelStyle}>Gate</label>
            <input name="ticketGate" type="text" required className={inputClass} style={inputStyle} placeholder="A" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={labelStyle}>Price (EUR)</label>
            <input name="ticketPrice" type="number" min="0" step="0.01" required className={inputClass} style={inputStyle} placeholder="25" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={labelStyle}>Quantity</label>
            <input name="ticketQuantity" type="number" min="1" step="1" required className={inputClass} style={inputStyle} placeholder="200" />
          </div>
        </div>
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
        {isPending ? "Creating…" : "Create event"}
      </button>
    </form>
  );
}
