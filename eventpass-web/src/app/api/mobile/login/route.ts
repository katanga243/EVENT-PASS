import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/db";
import { signMobileToken } from "@/backend/mobileAuth";
import { verifyPassword } from "@/backend/password";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  if (user.role !== "ORGANISER") {
    return NextResponse.json(
      { error: "Only organiser accounts can sign in to the mobile app." },
      { status: 403 }
    );
  }

  const token = signMobileToken({ id: user.id, role: user.role, name: user.name });

  return NextResponse.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
