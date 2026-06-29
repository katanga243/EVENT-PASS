import { NextRequest } from "next/server";
import { sign, verify } from "jsonwebtoken";

type MobileUser = { id: string; role: string; name: string };

export function signMobileToken(user: MobileUser) {
  return sign(
    { sub: user.id, role: user.role, name: user.name },
    process.env.MOBILE_AUTH_SECRET!,
    { expiresIn: "30d" }
  );
}

export function getMobileUser(req: NextRequest): MobileUser | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const payload = verify(token, process.env.MOBILE_AUTH_SECRET!) as {
      sub: string;
      role: string;
      name: string;
    };
    return { id: payload.sub, role: payload.role, name: payload.name };
  } catch {
    return null;
  }
}
