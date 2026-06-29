"use server";

import { writeFile, mkdir, readdir, unlink } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  updateUserProfile,
  updateUserAvatar,
  updateUserTheme,
  updateUserNotifications,
  ProfileError,
} from "@/backend/services/users";

const ALLOWED_AVATAR_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_AVATAR_BYTES = 3 * 1024 * 1024;

export async function updateProfileAction(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  const session = await auth();
  if (!session?.user) return "You need to be signed in.";

  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!name || !email) return "Name and email are required.";

  const avatar = formData.get("avatar") as File | null;
  if (avatar && avatar.size > 0) {
    const ext = ALLOWED_AVATAR_TYPES[avatar.type];
    if (!ext) return "Profile picture must be a JPEG, PNG, or WebP image.";
    if (avatar.size > MAX_AVATAR_BYTES) return "Profile picture must be under 3MB.";

    const dir = path.join(process.cwd(), "public", "avatars");
    await mkdir(dir, { recursive: true });

    const existing = await readdir(dir);
    await Promise.all(
      existing
        .filter((f) => f.startsWith(`${session.user.id}-`))
        .map((f) => unlink(path.join(dir, f)))
    );

    const filename = `${session.user.id}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await avatar.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);
    await updateUserAvatar(session.user.id, `/avatars/${filename}`);
  }

  try {
    await updateUserProfile(session.user.id, { name, email, phone });
  } catch (err) {
    if (err instanceof ProfileError) return err.message;
    throw err;
  }

  revalidatePath("/account/profile");
  revalidatePath("/account/profile/settings");
  return null;
}

export async function setThemeAction(theme: "light" | "dark") {
  const session = await auth();
  if (!session?.user) return;

  await updateUserTheme(session.user.id, theme);
  const cookieStore = await cookies();
  cookieStore.set("eventpass_theme", theme, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function setNotificationsAction(enabled: boolean) {
  const session = await auth();
  if (!session?.user) return;

  await updateUserNotifications(session.user.id, enabled);
  revalidatePath("/account/profile/settings");
}
