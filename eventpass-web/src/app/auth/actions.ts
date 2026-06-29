"use server";

import { prisma } from "@/backend/db";
import { signOut } from "@/auth";
import { hashPassword } from "@/backend/password";
import { missingRulesSummary, isPasswordValid } from "@/lib/passwordRules";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export async function createUserAction(
  _prev: string | null,
  formData: FormData
): Promise<string | null> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || !password) return "All fields are required.";
  if (!isPasswordValid(password, { name, email })) {
    return `Password doesn't meet the requirements: ${missingRulesSummary(password, { name, email })}.`;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return "An account with that email already exists.";

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: Role.BUYER,
    },
  });

  redirect("/auth/signin?created=1&email=" + encodeURIComponent(email));
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
