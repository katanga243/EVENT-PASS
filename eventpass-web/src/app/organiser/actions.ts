"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createOrganiserEvent } from "@/backend/services/organiser";

export async function createEventAction(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  const session = await auth();
  if (!session?.user) return "You need to be signed in.";
  if ((session.user as { role: string }).role !== "ORGANISER") {
    return "Only organisers can create events.";
  }

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const venueName = (formData.get("venueName") as string)?.trim();
  const city = formData.get("city") as string;
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  const imageUrl = (formData.get("imageUrl") as string)?.trim();
  const ticketName = (formData.get("ticketName") as string)?.trim();
  const ticketPrice = Number(formData.get("ticketPrice"));
  const ticketQuantity = Number(formData.get("ticketQuantity"));
  const ticketGate = (formData.get("ticketGate") as string)?.trim();

  if (!title || !description || !venueName || !imageUrl || !ticketName || !ticketGate) {
    return "Please fill in all required fields.";
  }
  if (city !== "MILANO" && city !== "TORINO") return "Please choose a city.";
  if (!date || !time) return "Please choose a date and time.";
  if (!Number.isFinite(ticketPrice) || ticketPrice < 0) return "Ticket price must be a valid number.";
  if (!Number.isFinite(ticketQuantity) || ticketQuantity <= 0) return "Ticket quantity must be a positive number.";

  const startsAt = new Date(`${date}T${time}:00`);
  if (Number.isNaN(startsAt.getTime())) return "Please choose a valid date and time.";

  const event = await createOrganiserEvent(session.user.id, {
    title,
    description,
    venueName,
    city,
    startsAt,
    imageUrl,
    ticketName,
    ticketPriceCents: Math.round(ticketPrice * 100),
    ticketQuantity,
    ticketGate,
  });

  revalidatePath("/organiser");
  revalidatePath("/organiser/finance");
  redirect(`/organiser/${event.id}`);
}
