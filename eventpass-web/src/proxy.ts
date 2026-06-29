import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const mobileApiCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function withMobileApiCors(response: NextResponse) {
  Object.entries(mobileApiCorsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export default NextAuth(authConfig).auth((req) => {
  if (req.nextUrl.pathname.startsWith("/api/mobile")) {
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: mobileApiCorsHeaders,
      });
    }

    return withMobileApiCors(NextResponse.next());
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/account/:path*", "/organiser/:path*", "/api/mobile/:path*"],
};
