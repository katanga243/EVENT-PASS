import { prisma } from "@/backend/db";

export function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
  });
}

export class ProfileError extends Error {}

export async function updateUserProfile(
  userId: string,
  data: { name: string; email: string; phone: string | null }
) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing && existing.id !== userId) {
    throw new ProfileError("That email is already in use by another account.");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { name: data.name, email: data.email, phone: data.phone },
  });
}

export function updateUserAvatar(userId: string, avatarUrl: string) {
  return prisma.user.update({ where: { id: userId }, data: { avatarUrl } });
}

export function getUserPreferences(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { theme: true, emailNotifications: true },
  });
}

export function updateUserTheme(userId: string, theme: "light" | "dark") {
  return prisma.user.update({ where: { id: userId }, data: { theme } });
}

export function updateUserNotifications(userId: string, emailNotifications: boolean) {
  return prisma.user.update({ where: { id: userId }, data: { emailNotifications } });
}
